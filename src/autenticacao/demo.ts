/**
 * Demonstração do Chain of Responsibility na autenticação: `npm run demo`.
 * Relógio fixo e ids sequenciais, para que a saída seja a mesma a cada execução.
 */
import { Account, AccountStatus, InMemoryAccountRepository } from "./dominio/account.ts";
import { InMemoryAuditLogger } from "./dominio/audit-log.ts";
import { type ClientIntegrityAttestation, solveProofOfWork } from "./dominio/client-integrity-attestation.ts";
import { Credential, type ScryptParams } from "./dominio/credential.ts";
import { LeakedPasswordBloomFilter } from "./dominio/leaked-password-bloom-filter.ts";
import { LoginRateLimiter } from "./dominio/login-rate-limiter.ts";
import { HmacTokenService, InMemorySessionStore } from "./dominio/session.ts";
import { StepUpAuthChallenge, StepUpTrigger } from "./dominio/step-up-auth-challenge.ts";
import { generateTotp, TwoFactorAuth } from "./dominio/two-factor-auth.ts";
import { AccountStatusHandler } from "./cadeia/account-status-handler.ts";
import {
    type AuthenticationDependencies,
    buildLoginChain,
    buildStepUpChain,
    describeChain,
} from "./cadeia/authentication-chains.ts";
import { AuthenticationContext, type AuthenticationOutcome } from "./cadeia/authentication-context.ts";
import { PasswordHandler } from "./cadeia/password-handler.ts";
import { RateLimitHandler } from "./cadeia/rate-limit-handler.ts";
import { LoginService } from "./login-service.ts";

// Custo do scrypt reduzido só para a demonstração rodar rápido; o padrão do código é o do OWASP (N = 2^17).
const DEMO_SCRYPT: ScryptParams = { N: 2 ** 14, r: 8, p: 1 };
const DIFFICULTY = 3;

let now = new Date("2026-10-18T18:00:00.000Z");
const clock = (): Date => now;
let sequence = 0;
const nextId = (): string => `sessao-${String(++sequence).padStart(2, "0")}`;

const anaSecret = Buffer.from("segredo-totp-da-ana-123", "utf8");
const credential = (password: string): Credential => Credential.fromPlainText(password, DEMO_SCRYPT);

const accounts = new InMemoryAccountRepository([
    new Account({
        id: "conta-ana",
        email: "ana@exemplo.com",
        role: "CREATOR",
        status: AccountStatus.ACTIVE,
        credential: credential("lua-cheia-sobre-o-lago-42"),
        twoFactor: new TwoFactorAuth(anaSecret),
    }),
    new Account({
        id: "conta-bruno",
        email: "bruno@exemplo.com",
        role: "VIEWER",
        status: AccountStatus.ACTIVE,
        credential: credential("trem-azul-de-domingo"),
    }),
    new Account({
        id: "conta-carla",
        email: "carla@exemplo.com",
        role: "VIEWER",
        status: AccountStatus.ACTIVE,
        credential: credential("senha123"),
    }),
    new Account({
        id: "conta-diego",
        email: "diego@exemplo.com",
        role: "VIEWER",
        status: AccountStatus.SUSPENDED,
        credential: credential("diego-segura-2026"),
    }),
    new Account({
        id: "conta-eva",
        email: "eva@exemplo.com",
        role: "CREATOR",
        status: AccountStatus.ACTIVE,
        credential: credential("eva-transmite-ao-vivo"),
    }),
]);

const deps: AuthenticationDependencies = {
    accounts,
    rateLimiter: new LoginRateLimiter(),
    leakedPasswords: LeakedPasswordBloomFilter.fromList([
        "123456",
        "senha123",
        "password",
        "qwerty",
        "admin123",
    ]),
    sessions: new InMemorySessionStore(),
    tokens: new HmacTokenService(Buffer.from("chave-de-assinatura-da-demo")),
    scryptParams: DEMO_SCRYPT,
    clientIntegrity: { minDifficulty: DIFFICULTY, maxAgeMs: 2 * 60 * 1000 },
    session: { nextId },
};
const audit = new InMemoryAuditLogger();
const loginChain = buildLoginChain(deps);
const stepUpChain = buildStepUpChain(deps);
const service = new LoginService({ loginChain, stepUpChain, audit, clock });

let challengeCounter = 0;
function attestation(hasWebDriverFlag = false): ClientIntegrityAttestation {
    const challenge = `desafio-${++challengeCounter}`;
    return {
        challenge,
        proofOfWorkNonce: solveProofOfWork(challenge, DIFFICULTY),
        difficulty: DIFFICULTY,
        hasWebDriverFlag,
        issuedAt: now,
    };
}

function request(
    email: string,
    password: string,
    extra: { totpCode?: string; ip?: string; webdriver?: boolean } = {},
) {
    return {
        email,
        password,
        clientIp: extra.ip ?? "200.130.10.1",
        userAgent: "Mozilla/5.0 (demo)",
        attestation: attestation(extra.webdriver),
        ...(extra.totpCode === undefined ? {} : { totpCode: extra.totpCode }),
    };
}

function title(text: string): void {
    console.log(`\n=== ${text} ===`);
}

function show(label: string, outcome: AuthenticationOutcome): void {
    console.log(`\n${label}`);
    console.log(`  resultado:  ${outcome.status}`);
    switch (outcome.status) {
        case "AUTHENTICATED":
            console.log(`  sessão:     ${outcome.session.id} (conta ${outcome.account.id})`);
            console.log(`  token:      ${outcome.accessToken.slice(0, 36)}…`);
            console.log(`  marcas:     ${outcome.flags.join(", ") || "(nenhuma)"}`);
            break;
        case "CHALLENGE":
            console.log(`  desafio:    ${outcome.challenge} (emitido por ${outcome.issuedBy})`);
            break;
        case "STEP_UP_GRANTED":
            console.log(`  liberado:   ${outcome.challenge.trigger} (desafio ${outcome.challenge.id})`);
            break;
        case "REJECTED":
            console.log(`  motivo:     ${outcome.reason} — ${outcome.detail}`);
            console.log(`  recusado:   ${outcome.rejectedBy}`);
            break;
    }
    console.log(`  passou por: ${outcome.trail.join(" → ") || "(nenhum elo)"}`);
}

title("1. As cadeias montadas");
console.log(`\nlogin:   ${describeChain(loginChain).join(" → ")}`);
console.log(`step-up: ${describeChain(stepUpChain).join(" → ")}`);

title("2. Espectador sem segundo fator");
show(
    "bruno@exemplo.com, senha correta:",
    service.login(request("bruno@exemplo.com", "trem-azul-de-domingo")),
);

title("3. Criadora com segundo fator (C03 da Entrega 01)");
show(
    "ana@exemplo.com, senha correta, sem código:",
    service.login(request("ana@exemplo.com", "lua-cheia-sobre-o-lago-42")),
);
const anaCode = generateTotp(anaSecret, now);
show(
    `ana@exemplo.com, senha correta, código ${anaCode}:`,
    service.login(request("ana@exemplo.com", "lua-cheia-sobre-o-lago-42", { totpCode: anaCode })),
);
show(
    `ana@exemplo.com, o mesmo código ${anaCode} de novo (reuso, RFC 6238 §5.2):`,
    service.login(
        request("ana@exemplo.com", "lua-cheia-sobre-o-lago-42", { totpCode: anaCode, ip: "200.130.10.9" }),
    ),
);

title("4. Senha em lista de vazamentos: entra, mas precisa trocar");
show('carla@exemplo.com, senha "senha123":', service.login(request("carla@exemplo.com", "senha123")));

title("5. Recusas: cada uma vem de um elo diferente");
show(
    "cliente automatizado (webdriver):",
    service.login(request("bruno@exemplo.com", "trem-azul-de-domingo", { webdriver: true, ip: "45.0.0.1" })),
);
show("e-mail inexistente:", service.login(request("ninguem@exemplo.com", "qualquer", { ip: "45.0.0.2" })));
show(
    "senha errada (mesma resposta do caso anterior):",
    service.login(request("carla@exemplo.com", "errada", { ip: "45.0.0.3" })),
);
show(
    "conta suspensa, senha correta:",
    service.login(request("diego@exemplo.com", "diego-segura-2026", { ip: "45.0.0.4" })),
);
show(
    "criador sem segundo fator cadastrado:",
    service.login(request("eva@exemplo.com", "eva-transmite-ao-vivo", { ip: "45.0.0.5" })),
);

title("6. Limite de tentativas (O07 da Entrega 01): 5 falhas em 15 minutos");
for (let attempt = 1; attempt <= 5; attempt++) {
    const outcome = service.login(
        request("bruno@exemplo.com", `chute-${attempt}`, { ip: `177.0.0.${attempt}` }),
    );
    console.log(`  tentativa ${attempt}: ${outcome.status === "REJECTED" ? outcome.reason : outcome.status}`);
}
show(
    "sexta tentativa, agora com a senha correta:",
    service.login(request("bruno@exemplo.com", "trem-azul-de-domingo", { ip: "177.0.0.6" })),
);

title("7. Step-up: rotação da stream key reaproveita os elos");
now = new Date(now.getTime() + 60_000);
const rotation = new StepUpAuthChallenge({
    id: "stepup-01",
    accountId: "conta-ana",
    trigger: StepUpTrigger.STREAM_KEY_ROTATION,
    expiresAt: new Date(now.getTime() + 5 * 60_000),
});
const stepUpCode = generateTotp(anaSecret, now);
show(
    `ana@exemplo.com confirma senha e código ${stepUpCode}:`,
    service.confirmStepUp({
        email: "ana@exemplo.com",
        password: "lua-cheia-sobre-o-lago-42",
        totpCode: stepUpCode,
        clientIp: "200.130.10.1",
        userAgent: "Mozilla/5.0 (demo)",
        stepUpChallenge: rotation,
    }),
);

title("8. Cadeia sem elo terminal: falha fechada");
const incomplete = new RateLimitHandler(new LoginRateLimiter());
incomplete.setNext(new PasswordHandler(accounts, DEMO_SCRYPT)).setNext(new AccountStatusHandler());
console.log(`\ncadeia:     ${describeChain(incomplete).join(" → ")}`);
show(
    "bruno@exemplo.com, senha correta:",
    incomplete.handle(
        new AuthenticationContext(
            request("bruno@exemplo.com", "trem-azul-de-domingo", { ip: "10.0.0.8" }),
            now,
        ),
    ),
);

title("9. Trilha de auditoria registrada pelo LoginService");
for (const entry of audit.entries) {
    const metadata = Object.entries(entry.metadata)
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");
    console.log(`  ${entry.eventType.padEnd(26)} ${entry.targetEmail.padEnd(20)} ${metadata}`);
}
