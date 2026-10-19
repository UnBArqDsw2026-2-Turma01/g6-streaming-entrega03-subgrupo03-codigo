import type { AccountRepository } from "../dominio/account.ts";
import type { ScryptParams } from "../dominio/credential.ts";
import type { LeakedPasswordBloomFilter } from "../dominio/leaked-password-bloom-filter.ts";
import type { LoginRateLimiter } from "../dominio/login-rate-limiter.ts";
import type { HmacTokenService, SessionStore } from "../dominio/session.ts";
import { AccountStatusHandler } from "./account-status-handler.ts";
import type { AuthenticationHandler } from "./authentication-handler.ts";
import { ClientIntegrityHandler, type ClientIntegrityOptions } from "./client-integrity-handler.ts";
import { LeakedPasswordHandler } from "./leaked-password-handler.ts";
import { PasswordHandler } from "./password-handler.ts";
import { RateLimitHandler } from "./rate-limit-handler.ts";
import { SessionIssuerHandler, type SessionIssuerOptions } from "./session-issuer-handler.ts";
import { StepUpGrantHandler } from "./step-up-grant-handler.ts";
import { TwoFactorHandler } from "./two-factor-handler.ts";

export interface AuthenticationDependencies {
    readonly accounts: AccountRepository;
    readonly rateLimiter: LoginRateLimiter;
    readonly leakedPasswords: LeakedPasswordBloomFilter;
    readonly sessions: SessionStore;
    readonly tokens: HmacTokenService;
    readonly scryptParams?: ScryptParams;
    readonly clientIntegrity?: ClientIntegrityOptions;
    readonly session?: Partial<SessionIssuerOptions>;
}

/**
 * Cadeia de login. A ordem é uma decisão de projeto (ADR-004, D3): primeiro o que
 * é barato e barra automação, depois a senha, e só então o que depende da conta.
 */
export function buildLoginChain(deps: AuthenticationDependencies): AuthenticationHandler {
    const head = new RateLimitHandler(deps.rateLimiter);
    head.setNext(new ClientIntegrityHandler(deps.clientIntegrity))
        .setNext(new PasswordHandler(deps.accounts, deps.scryptParams))
        .setNext(new AccountStatusHandler())
        .setNext(new LeakedPasswordHandler(deps.leakedPasswords))
        .setNext(new TwoFactorHandler())
        .setNext(new SessionIssuerHandler(deps.sessions, deps.tokens, deps.session));
    return head;
}

/**
 * Cadeia de step-up (reautenticação antes de ação sensível). Reaproveita quatro
 * classes da cadeia de login, sem atestação nem lista de vazamentos (a sessão já
 * existe), força o segundo fator e termina em outro elo.
 */
export function buildStepUpChain(deps: AuthenticationDependencies): AuthenticationHandler {
    const head = new RateLimitHandler(deps.rateLimiter);
    head.setNext(new PasswordHandler(deps.accounts, deps.scryptParams))
        .setNext(new AccountStatusHandler())
        .setNext(new TwoFactorHandler({ alwaysRequire: true }))
        .setNext(new StepUpGrantHandler());
    return head;
}

/** Nomes dos elos na ordem, percorrendo os sucessores (usado na demonstração). */
export function describeChain(head: AuthenticationHandler): string[] {
    const names: string[] = [];
    let current: AuthenticationHandler | null = head;
    while (current) {
        names.push(current.name);
        current = current.next;
    }
    return names;
}
