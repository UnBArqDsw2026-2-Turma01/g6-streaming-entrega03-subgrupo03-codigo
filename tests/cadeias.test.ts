import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AccountStatus } from "../src/autenticacao/dominio/account.ts";
import { InMemoryAuditLogger } from "../src/autenticacao/dominio/audit-log.ts";
import { StepUpAuthChallenge } from "../src/autenticacao/dominio/step-up-auth-challenge.ts";
import { generateTotp } from "../src/autenticacao/dominio/two-factor-auth.ts";
import {
    buildLoginChain,
    buildStepUpChain,
    describeChain,
} from "../src/autenticacao/cadeia/authentication-chains.ts";
import { LoginService } from "../src/autenticacao/login-service.ts";
import { context, loginRequest, makeAccount, makeDeps, NOW, TOTP_SECRET } from "./helpers.ts";

const LOGIN_ORDER = [
    "RateLimitHandler",
    "ClientIntegrityHandler",
    "PasswordHandler",
    "AccountStatusHandler",
    "LeakedPasswordHandler",
    "TwoFactorHandler",
    "SessionIssuerHandler",
];

describe("cadeia de login", () => {
    it("é montada na ordem decidida no ADR-004", () => {
        const { deps } = makeDeps([]);
        assert.deepEqual(describeChain(buildLoginChain(deps)), LOGIN_ORDER);
    });

    it("login aprovado percorre todos os elos, na ordem", () => {
        const { deps, sessions } = makeDeps([makeAccount("a@x.com", "correta")]);
        const outcome = buildLoginChain(deps).handle(context(loginRequest("a@x.com", "correta")));
        assert.equal(outcome.status, "AUTHENTICATED");
        assert.deepEqual(outcome.trail, LOGIN_ORDER);
        assert.equal(sessions.sessions.length, 1);
    });

    it("cada recusa vem do elo responsável e interrompe a cadeia ali", () => {
        const { deps, sessions } = makeDeps([
            makeAccount("suspensa@x.com", "p", { status: AccountStatus.SUSPENDED }),
            makeAccount("criador@x.com", "p", { role: "CREATOR" }),
        ]);
        const chain = buildLoginChain(deps);
        const cases: Array<[ReturnType<typeof loginRequest>, string, string]> = [
            [
                loginRequest("x@x.com", "p", { attestation: undefined, clientIp: "1.1.1.1" }),
                "ClientIntegrityHandler",
                "CLIENT_INTEGRITY_FAILED",
            ],
            [loginRequest("x@x.com", "p", { clientIp: "1.1.1.2" }), "PasswordHandler", "INVALID_CREDENTIALS"],
            [
                loginRequest("suspensa@x.com", "p", { clientIp: "1.1.1.3" }),
                "AccountStatusHandler",
                "ACCOUNT_SUSPENDED",
            ],
            [
                loginRequest("criador@x.com", "p", { clientIp: "1.1.1.4" }),
                "TwoFactorHandler",
                "MFA_ENROLLMENT_REQUIRED",
            ],
        ];
        for (const [request, rejectedBy, reason] of cases) {
            const outcome = chain.handle(context(request));
            assert.equal(outcome.status, "REJECTED");
            if (outcome.status !== "REJECTED") continue;
            assert.equal(outcome.rejectedBy, rejectedBy);
            assert.equal(outcome.reason, reason);
            assert.deepEqual(outcome.trail, LOGIN_ORDER.slice(0, LOGIN_ORDER.indexOf(rejectedBy)));
        }
        assert.equal(sessions.sessions.length, 0);
    });

    it("conta suspensa só é revelada a quem prova a senha", () => {
        const { deps } = makeDeps([
            makeAccount("suspensa@x.com", "correta", { status: AccountStatus.SUSPENDED }),
        ]);
        const outcome = buildLoginChain(deps).handle(context(loginRequest("suspensa@x.com", "errada")));
        assert.equal(outcome.status === "REJECTED" && outcome.reason, "INVALID_CREDENTIALS");
    });

    it("criadora com 2FA: desafio, depois sessão", () => {
        const { deps } = makeDeps([makeAccount("ana@x.com", "p", { role: "CREATOR", twoFactor: true })]);
        const chain = buildLoginChain(deps);
        assert.equal(chain.handle(context(loginRequest("ana@x.com", "p"))).status, "CHALLENGE");
        const code = generateTotp(TOTP_SECRET, NOW);
        assert.equal(
            chain.handle(context(loginRequest("ana@x.com", "p", { totpCode: code }))).status,
            "AUTHENTICATED",
        );
    });

    it("senha vazada autentica com a marca de troca obrigatória", () => {
        const { deps } = makeDeps([makeAccount("a@x.com", "senha123")]);
        const outcome = buildLoginChain(deps).handle(context(loginRequest("a@x.com", "senha123")));
        assert.equal(outcome.status, "AUTHENTICATED");
        assert.deepEqual(outcome.status === "AUTHENTICATED" && outcome.flags, ["PASSWORD_CHANGE_REQUIRED"]);
    });

    it("cinco falhas bloqueiam a sexta tentativa, mesmo com a senha correta; sucesso zera a contagem", () => {
        const { deps } = makeDeps([makeAccount("a@x.com", "correta")]);
        const chain = buildLoginChain(deps);
        for (let i = 0; i < 4; i++)
            chain.handle(context(loginRequest("a@x.com", "errada", { clientIp: `2.2.2.${i}` })));
        assert.equal(
            chain.handle(context(loginRequest("a@x.com", "correta", { clientIp: "2.2.2.9" }))).status,
            "AUTHENTICATED",
        );
        for (let i = 0; i < 5; i++)
            chain.handle(context(loginRequest("a@x.com", "errada", { clientIp: `3.3.3.${i}` })));
        const blocked = buildLoginChain(deps).handle(
            context(loginRequest("a@x.com", "correta", { clientIp: "3.3.3.9" })),
        );
        assert.equal(blocked.status === "REJECTED" && blocked.reason, "RATE_LIMITED");
    });
});

describe("cadeia de step-up", () => {
    it("reaproveita os elos sem atestação nem lista de vazamentos", () => {
        const { deps } = makeDeps([]);
        assert.deepEqual(describeChain(buildStepUpChain(deps)), [
            "RateLimitHandler",
            "PasswordHandler",
            "AccountStatusHandler",
            "TwoFactorHandler",
            "StepUpGrantHandler",
        ]);
    });

    it("conclui o desafio com senha e código", () => {
        const ana = makeAccount("ana@x.com", "p", { role: "CREATOR", twoFactor: true });
        const { deps } = makeDeps([ana]);
        const challenge = new StepUpAuthChallenge({
            id: "c",
            accountId: ana.id,
            trigger: "STREAM_KEY_ROTATION",
            expiresAt: new Date(NOW.getTime() + 60_000),
        });
        const outcome = buildStepUpChain(deps).handle(
            context(
                loginRequest("ana@x.com", "p", {
                    totpCode: generateTotp(TOTP_SECRET, NOW),
                    stepUpChallenge: challenge,
                    attestation: undefined,
                }),
            ),
        );
        assert.equal(outcome.status, "STEP_UP_GRANTED");
        assert.equal(challenge.isCompleted, true);
    });
});

describe("LoginService (Client)", () => {
    it("registra sucesso e falha na trilha de auditoria, sem registrar desafios", () => {
        const { deps } = makeDeps([
            makeAccount("a@x.com", "p"),
            makeAccount("ana@x.com", "p", { role: "CREATOR", twoFactor: true }),
        ]);
        const audit = new InMemoryAuditLogger();
        const service = new LoginService({
            loginChain: buildLoginChain(deps),
            stepUpChain: buildStepUpChain(deps),
            audit,
            clock: () => NOW,
        });
        service.login(loginRequest("a@x.com", "p"));
        service.login(loginRequest("a@x.com", "errada"));
        service.login(loginRequest("ana@x.com", "p"));
        assert.deepEqual(
            audit.entries.map((entry) => [entry.eventType, entry.metadata.reason ?? ""]),
            [
                ["LOGIN_SUCCESS", ""],
                ["LOGIN_FAILURE", "INVALID_CREDENTIALS"],
            ],
        );
    });

    it("registra a falha de step-up", () => {
        const { deps } = makeDeps([makeAccount("a@x.com", "p")]);
        const audit = new InMemoryAuditLogger();
        const service = new LoginService({
            loginChain: buildLoginChain(deps),
            stepUpChain: buildStepUpChain(deps),
            audit,
            clock: () => NOW,
        });
        service.confirmStepUp(loginRequest("a@x.com", "p"));
        assert.equal(audit.entries[0]?.eventType, "STEP_UP_CHALLENGE_FAILED");
        assert.equal(audit.entries[0]?.metadata.reason, "MFA_ENROLLMENT_REQUIRED");
    });
});
