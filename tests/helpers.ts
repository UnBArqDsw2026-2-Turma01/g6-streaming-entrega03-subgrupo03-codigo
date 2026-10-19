import {
    Account,
    AccountStatus,
    type AccountRole,
    InMemoryAccountRepository,
} from "../src/autenticacao/dominio/account.ts";
import {
    type ClientIntegrityAttestation,
    solveProofOfWork,
} from "../src/autenticacao/dominio/client-integrity-attestation.ts";
import { Credential, type ScryptParams } from "../src/autenticacao/dominio/credential.ts";
import { LeakedPasswordBloomFilter } from "../src/autenticacao/dominio/leaked-password-bloom-filter.ts";
import { LoginRateLimiter } from "../src/autenticacao/dominio/login-rate-limiter.ts";
import { HmacTokenService, InMemorySessionStore } from "../src/autenticacao/dominio/session.ts";
import { TwoFactorAuth } from "../src/autenticacao/dominio/two-factor-auth.ts";
import {
    AuthenticationContext,
    type AuthenticationOutcome,
    type AuthenticationRequest,
} from "../src/autenticacao/cadeia/authentication-context.ts";
import type { AuthenticationDependencies } from "../src/autenticacao/cadeia/authentication-chains.ts";
import type { AuthenticationHandler } from "../src/autenticacao/cadeia/authentication-handler.ts";

/** Custo baixo só nos testes, para a suíte não levar meio segundo por hash. */
export const FAST_SCRYPT: ScryptParams = { N: 2 ** 10, r: 8, p: 1 };
export const DIFFICULTY = 2;
export const NOW = new Date("2026-10-18T18:00:00.000Z");
export const TOTP_SECRET = Buffer.from("12345678901234567890", "ascii");

export function makeAccount(
    email: string,
    password: string,
    options: { role?: AccountRole; status?: AccountStatus; twoFactor?: boolean } = {},
): Account {
    return new Account({
        id: `id-${email}`,
        email,
        role: options.role ?? "VIEWER",
        status: options.status ?? AccountStatus.ACTIVE,
        credential: Credential.fromPlainText(password, FAST_SCRYPT),
        twoFactor: options.twoFactor ? new TwoFactorAuth(TOTP_SECRET) : null,
    });
}

export function attestation(overrides: Partial<ClientIntegrityAttestation> = {}): ClientIntegrityAttestation {
    const challenge = overrides.challenge ?? `desafio-${Math.random()}`;
    return {
        challenge,
        proofOfWorkNonce: solveProofOfWork(challenge, DIFFICULTY),
        difficulty: DIFFICULTY,
        hasWebDriverFlag: false,
        issuedAt: NOW,
        ...overrides,
    };
}

export function loginRequest(
    email: string,
    password: string,
    extra: Partial<AuthenticationRequest> = {},
): AuthenticationRequest {
    return {
        email,
        password,
        clientIp: "10.0.0.1",
        userAgent: "teste",
        attestation: attestation(),
        ...extra,
    };
}

export function context(request: AuthenticationRequest, now: Date = NOW): AuthenticationContext {
    return new AuthenticationContext(request, now);
}

export function makeDeps(accounts: Account[], overrides: Partial<AuthenticationDependencies> = {}) {
    const sessions = new InMemorySessionStore();
    const rateLimiter = new LoginRateLimiter();
    const deps: AuthenticationDependencies = {
        accounts: new InMemoryAccountRepository(accounts),
        rateLimiter,
        leakedPasswords: LeakedPasswordBloomFilter.fromList(["senha123", "123456"]),
        sessions,
        tokens: new HmacTokenService(Buffer.from("segredo-de-teste")),
        scryptParams: FAST_SCRYPT,
        clientIntegrity: { minDifficulty: DIFFICULTY, maxAgeMs: 60_000 },
        ...overrides,
    };
    return { deps, sessions, rateLimiter };
}

/** Sucessor dublê: registra se foi chamado e devolve um resultado fixo. */
export class SpyHandler implements AuthenticationHandler {
    readonly name = "SpyHandler";
    readonly next = null;
    calls = 0;
    lastContext: AuthenticationContext | null = null;

    setNext(next: AuthenticationHandler): AuthenticationHandler {
        return next;
    }

    handle(ctx: AuthenticationContext): AuthenticationOutcome {
        this.calls++;
        this.lastContext = ctx;
        return { status: "CHALLENGE", challenge: "TOTP_REQUIRED", issuedBy: this.name, trail: ctx.trail };
    }
}
