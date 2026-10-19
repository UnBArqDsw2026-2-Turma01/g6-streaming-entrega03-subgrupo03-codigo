import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccountStatus, InMemoryAccountRepository } from "../src/autenticacao/dominio/account.ts";
import { LeakedPasswordBloomFilter } from "../src/autenticacao/dominio/leaked-password-bloom-filter.ts";
import { LoginRateLimiter } from "../src/autenticacao/dominio/login-rate-limiter.ts";
import { HmacTokenService, InMemorySessionStore } from "../src/autenticacao/dominio/session.ts";
import { StepUpAuthChallenge } from "../src/autenticacao/dominio/step-up-auth-challenge.ts";
import { generateTotp } from "../src/autenticacao/dominio/two-factor-auth.ts";
import { AccountStatusHandler } from "../src/autenticacao/cadeia/account-status-handler.ts";
import { ClientIntegrityHandler } from "../src/autenticacao/cadeia/client-integrity-handler.ts";
import { LeakedPasswordHandler } from "../src/autenticacao/cadeia/leaked-password-handler.ts";
import { PasswordHandler } from "../src/autenticacao/cadeia/password-handler.ts";
import { RateLimitHandler } from "../src/autenticacao/cadeia/rate-limit-handler.ts";
import { SessionIssuerHandler } from "../src/autenticacao/cadeia/session-issuer-handler.ts";
import { StepUpGrantHandler } from "../src/autenticacao/cadeia/step-up-grant-handler.ts";
import { TwoFactorHandler } from "../src/autenticacao/cadeia/two-factor-handler.ts";
import {
    attestation,
    context,
    DIFFICULTY,
    FAST_SCRYPT,
    loginRequest,
    makeAccount,
    NOW,
    SpyHandler,
    TOTP_SECRET,
} from "./helpers.ts";

const integrity = { minDifficulty: DIFFICULTY, maxAgeMs: 60_000 };

describe("AbstractAuthenticationHandler", () => {
    it("repassa ao sucessor e registra o elo na trilha", () => {
        const handler = new AccountStatusHandler();
        const spy = new SpyHandler();
        handler.setNext(spy);
        const ctx = context(loginRequest("a@x.com", "p"));
        ctx.account = makeAccount("a@x.com", "p");
        handler.handle(ctx);
        assert.equal(spy.calls, 1);
        assert.deepEqual(ctx.trail, ["AccountStatusHandler"]);
    });

    it("sem sucessor, recusa com UNHANDLED (falha fechada)", () => {
        const handler = new LeakedPasswordHandler(LeakedPasswordBloomFilter.fromList(["x"]));
        const outcome = handler.handle(context(loginRequest("a@x.com", "p")));
        assert.equal(outcome.status, "REJECTED");
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "UNHANDLED");
    });

    it("setNext devolve o sucessor, permitindo montar a cadeia encadeando chamadas", () => {
        const first = new AccountStatusHandler();
        const second = new AccountStatusHandler();
        assert.equal(first.setNext(second), second);
        assert.equal(first.next, second);
    });
});

describe("RateLimitHandler", () => {
    it("recusa sem chamar o sucessor quando o e-mail está bloqueado", () => {
        const limiter = new LoginRateLimiter({ maxFailures: 1, windowMs: 60_000 });
        limiter.recordFailure("email:a@x.com", NOW);
        const handler = new RateLimitHandler(limiter);
        const spy = new SpyHandler();
        handler.setNext(spy);
        const outcome = handler.handle(context(loginRequest("A@x.com", "p")));
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "RATE_LIMITED");
        assert.equal(spy.calls, 0);
    });

    it("conta a falha de credencial devolvida pelo restante da cadeia", () => {
        const limiter = new LoginRateLimiter({ maxFailures: 1, windowMs: 60_000 });
        const handler = new RateLimitHandler(limiter);
        handler.setNext(new PasswordHandler(new InMemoryAccountRepository(), FAST_SCRYPT));
        handler.handle(context(loginRequest("a@x.com", "p")));
        assert.equal(limiter.isBlocked("email:a@x.com", NOW), true);
        assert.equal(limiter.isBlocked("ip:10.0.0.1", NOW), true);
    });

    it("não conta recusas que não são de credencial", () => {
        const limiter = new LoginRateLimiter({ maxFailures: 1, windowMs: 60_000 });
        const handler = new RateLimitHandler(limiter);
        handler.setNext(new ClientIntegrityHandler(integrity));
        handler.handle(
            context(loginRequest("a@x.com", "p", { attestation: attestation({ hasWebDriverFlag: true }) })),
        );
        assert.equal(limiter.isBlocked("email:a@x.com", NOW), false);
    });
});

describe("ClientIntegrityHandler", () => {
    const cases: Array<[string, Parameters<typeof loginRequest>[2]]> = [
        ["sem atestação", { attestation: undefined }],
        ["com webdriver", { attestation: attestation({ hasWebDriverFlag: true }) }],
        ["expirada", { attestation: attestation({ issuedAt: new Date(NOW.getTime() - 61_000) }) }],
        ["com nonce errado", { attestation: { ...attestation(), proofOfWorkNonce: "x" } }],
        ["com dificuldade menor que a exigida", { attestation: { ...attestation(), difficulty: 0 } }],
    ];
    for (const [label, extra] of cases) {
        it(`recusa atestação ${label}`, () => {
            const handler = new ClientIntegrityHandler(integrity);
            const spy = new SpyHandler();
            handler.setNext(spy);
            const outcome = handler.handle(context(loginRequest("a@x.com", "p", extra)));
            assert.equal(outcome.status === "REJECTED" && outcome.reason, "CLIENT_INTEGRITY_FAILED");
            assert.equal(spy.calls, 0);
        });
    }

    it("deixa passar atestação válida", () => {
        const handler = new ClientIntegrityHandler(integrity);
        const spy = new SpyHandler();
        handler.setNext(spy);
        handler.handle(context(loginRequest("a@x.com", "p")));
        assert.equal(spy.calls, 1);
    });
});

describe("PasswordHandler", () => {
    const account = makeAccount("a@x.com", "correta");
    const repository = new InMemoryAccountRepository([account]);

    it("com senha correta, coloca a conta no contexto e segue", () => {
        const handler = new PasswordHandler(repository, FAST_SCRYPT);
        const spy = new SpyHandler();
        handler.setNext(spy);
        handler.handle(context(loginRequest(" A@X.com ", "correta")));
        assert.equal(spy.lastContext?.account, account);
    });

    it("e-mail inexistente e senha errada têm a mesma recusa", () => {
        const handler = new PasswordHandler(repository, FAST_SCRYPT);
        const unknown = handler.handle(context(loginRequest("b@x.com", "correta")));
        const wrong = handler.handle(context(loginRequest("a@x.com", "errada")));
        assert.equal(unknown.status, "REJECTED");
        assert.deepEqual(unknown, wrong);
    });
});

describe("AccountStatusHandler", () => {
    const blocked: Array<[AccountStatus, string]> = [
        [AccountStatus.SUSPENDED, "ACCOUNT_SUSPENDED"],
        [AccountStatus.DEACTIVATED, "ACCOUNT_DEACTIVATED"],
        [AccountStatus.PENDING_VERIFICATION, "EMAIL_NOT_VERIFIED"],
    ];
    for (const [status, reason] of blocked) {
        it(`recusa conta ${status} com ${reason}`, () => {
            const ctx = context(loginRequest("a@x.com", "p"));
            ctx.account = makeAccount("a@x.com", "p", { status });
            const outcome = new AccountStatusHandler().handle(ctx);
            assert.equal(outcome.status === "REJECTED" && outcome.reason, reason);
        });
    }

    it("recusa se a cadeia foi montada sem localizar a conta antes", () => {
        const outcome = new AccountStatusHandler().handle(context(loginRequest("a@x.com", "p")));
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "UNHANDLED");
    });
});

describe("LeakedPasswordHandler", () => {
    it("marca a troca obrigatória e segue mesmo assim", () => {
        const handler = new LeakedPasswordHandler(LeakedPasswordBloomFilter.fromList(["senha123"]));
        const spy = new SpyHandler();
        handler.setNext(spy);
        const ctx = context(loginRequest("a@x.com", "senha123"));
        handler.handle(ctx);
        assert.equal(spy.calls, 1);
        assert.equal(ctx.flags.has("PASSWORD_CHANGE_REQUIRED"), true);
    });

    it("não marca senha fora da lista", () => {
        const handler = new LeakedPasswordHandler(LeakedPasswordBloomFilter.fromList(["senha123"]));
        handler.setNext(new SpyHandler());
        const ctx = context(loginRequest("a@x.com", "cavalo-correto-bateria-grampo"));
        handler.handle(ctx);
        assert.equal(ctx.flags.size, 0);
    });
});

describe("TwoFactorHandler", () => {
    function run(account: ReturnType<typeof makeAccount>, totpCode?: string, alwaysRequire = false) {
        const handler = new TwoFactorHandler({ alwaysRequire });
        const spy = new SpyHandler();
        handler.setNext(spy);
        const ctx = context(loginRequest("a@x.com", "p", totpCode === undefined ? {} : { totpCode }));
        ctx.account = account;
        return { outcome: handler.handle(ctx), spy };
    }

    it("espectador sem segundo fator passa direto", () => {
        const { spy } = run(makeAccount("a@x.com", "p"));
        assert.equal(spy.calls, 1);
    });

    it("sem código, responde com desafio e para a cadeia", () => {
        const { outcome, spy } = run(makeAccount("a@x.com", "p", { twoFactor: true }));
        assert.equal(outcome.status, "CHALLENGE");
        assert.equal(outcome.status === "CHALLENGE" && outcome.issuedBy, "TwoFactorHandler");
        assert.equal(spy.calls, 0);
    });

    it("com código válido, segue", () => {
        const { spy } = run(makeAccount("a@x.com", "p", { twoFactor: true }), generateTotp(TOTP_SECRET, NOW));
        assert.equal(spy.calls, 1);
    });

    it("com código inválido, recusa com INVALID_TOTP", () => {
        const { outcome } = run(makeAccount("a@x.com", "p", { twoFactor: true }), "000000");
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "INVALID_TOTP");
    });

    it("criador sem segundo fator cadastrado é recusado (C03)", () => {
        const { outcome } = run(makeAccount("a@x.com", "p", { role: "CREATOR" }));
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "MFA_ENROLLMENT_REQUIRED");
    });

    it("com alwaysRequire, exige o segundo fator até de espectador", () => {
        const { outcome } = run(makeAccount("a@x.com", "p"), undefined, true);
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "MFA_ENROLLMENT_REQUIRED");
    });
});

describe("SessionIssuerHandler", () => {
    it("cria a sessão, emite um token verificável e não chama sucessor", () => {
        const sessions = new InMemorySessionStore();
        const tokens = new HmacTokenService(Buffer.from("segredo"));
        const handler = new SessionIssuerHandler(sessions, tokens, { nextId: () => "s-1", ttlMs: 60_000 });
        const spy = new SpyHandler();
        handler.setNext(spy);
        const ctx = context(loginRequest("a@x.com", "p"));
        ctx.account = makeAccount("a@x.com", "p");
        const outcome = handler.handle(ctx);
        assert.equal(outcome.status, "AUTHENTICATED");
        assert.equal(spy.calls, 0);
        assert.equal(sessions.sessions.length, 1);
        if (outcome.status !== "AUTHENTICATED") return;
        assert.equal(tokens.verify(outcome.accessToken, NOW)?.sessionId, "s-1");
        assert.equal(tokens.verify(outcome.accessToken, new Date(NOW.getTime() + 60_000)), null);
        assert.equal(tokens.verify(`${outcome.accessToken}x`, NOW), null);
    });
});

describe("StepUpGrantHandler", () => {
    const account = makeAccount("a@x.com", "p");
    function challenge(accountId = account.id, expiresAt = new Date(NOW.getTime() + 60_000)) {
        return new StepUpAuthChallenge({ id: "c", accountId, trigger: "STREAM_KEY_ROTATION", expiresAt });
    }
    function run(stepUpChallenge?: StepUpAuthChallenge) {
        const ctx = context(loginRequest("a@x.com", "p", stepUpChallenge ? { stepUpChallenge } : {}));
        ctx.account = account;
        return new StepUpGrantHandler().handle(ctx);
    }

    it("conclui o desafio da própria conta", () => {
        const c = challenge();
        assert.equal(run(c).status, "STEP_UP_GRANTED");
        assert.equal(c.isCompleted, true);
    });

    it("recusa desafio ausente, de outra conta, expirado ou já concluído", () => {
        const done = challenge();
        done.complete();
        for (const c of [undefined, challenge("outra"), challenge(account.id, NOW), done]) {
            const outcome = run(c);
            assert.equal(outcome.status === "REJECTED" && outcome.reason, "STEP_UP_INVALID");
        }
    });
});
