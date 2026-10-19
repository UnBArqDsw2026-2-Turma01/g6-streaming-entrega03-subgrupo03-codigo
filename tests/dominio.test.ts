import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    solveProofOfWork,
    verifyProofOfWork,
} from "../src/autenticacao/dominio/client-integrity-attestation.ts";
import { Credential } from "../src/autenticacao/dominio/credential.ts";
import { LeakedPasswordBloomFilter } from "../src/autenticacao/dominio/leaked-password-bloom-filter.ts";
import { LoginRateLimiter } from "../src/autenticacao/dominio/login-rate-limiter.ts";
import { generateTotp, TwoFactorAuth } from "../src/autenticacao/dominio/two-factor-auth.ts";
import { FAST_SCRYPT, TOTP_SECRET } from "./helpers.ts";

describe("TOTP (RFC 6238)", () => {
    // Apêndice B da RFC 6238, coluna SHA-1, 8 dígitos, segredo "12345678901234567890".
    const vectors: Array<[number, string]> = [
        [59, "94287082"],
        [1111111109, "07081804"],
        [1111111111, "14050471"],
        [1234567890, "89005924"],
        [2000000000, "69279037"],
        [20000000000, "65353130"],
    ];
    for (const [seconds, expected] of vectors) {
        it(`gera ${expected} em T = ${seconds}`, () => {
            assert.equal(generateTotp(TOTP_SECRET, new Date(seconds * 1000), { digits: 8 }), expected);
        });
    }

    it("aceita o passo anterior por atraso de relógio", () => {
        const at = new Date(1_000_000_000_000);
        const previous = generateTotp(TOTP_SECRET, new Date(at.getTime() - 30_000));
        assert.equal(new TwoFactorAuth(TOTP_SECRET).verifyToken(previous, at), true);
    });

    it("recusa código fora da janela", () => {
        const at = new Date(1_000_000_000_000);
        const old = generateTotp(TOTP_SECRET, new Date(at.getTime() - 120_000));
        assert.equal(new TwoFactorAuth(TOTP_SECRET).verifyToken(old, at), false);
    });

    it("recusa o reuso de um código já aceito (RFC 6238 §5.2)", () => {
        const at = new Date(1_000_000_000_000);
        const auth = new TwoFactorAuth(TOTP_SECRET);
        const code = generateTotp(TOTP_SECRET, at);
        assert.equal(auth.verifyToken(code, at), true);
        assert.equal(auth.verifyToken(code, at), false);
    });
});

describe("Credential", () => {
    it("confere a senha correta e recusa a errada", () => {
        const credential = Credential.fromPlainText("correta", FAST_SCRYPT);
        assert.equal(credential.verifyPassword("correta"), true);
        assert.equal(credential.verifyPassword("errada"), false);
    });

    it("usa sal aleatório: a mesma senha gera hashes diferentes", () => {
        const a = Credential.fromPlainText("igual", FAST_SCRYPT);
        const b = Credential.fromPlainText("igual", FAST_SCRYPT);
        assert.notDeepEqual(a.passwordHash, b.passwordHash);
    });
});

describe("LeakedPasswordBloomFilter", () => {
    it("nunca dá falso negativo", () => {
        const passwords = Array.from({ length: 500 }, (_, i) => `vazada-${i}`);
        const filter = LeakedPasswordBloomFilter.fromList(passwords);
        for (const password of passwords) assert.equal(filter.mightContain(password), true);
    });

    it("mantém a taxa de falso positivo perto da configurada", () => {
        const filter = LeakedPasswordBloomFilter.fromList(
            Array.from({ length: 1000 }, (_, i) => `vazada-${i}`),
            0.01,
        );
        let falsePositives = 0;
        for (let i = 0; i < 10_000; i++) if (filter.mightContain(`limpa-${i}`)) falsePositives++;
        assert.ok(falsePositives / 10_000 < 0.03, `taxa observada ${falsePositives / 10_000}`);
    });

    it("dimensiona m e k pelas fórmulas clássicas", () => {
        const filter = new LeakedPasswordBloomFilter(1000, 0.01);
        assert.equal(filter.sizeInBits, 9586);
        assert.equal(filter.hashCount, 7);
    });
});

describe("Prova de trabalho", () => {
    it("aceita o nonce resolvido e recusa outro", () => {
        const nonce = solveProofOfWork("desafio", 3);
        assert.equal(verifyProofOfWork("desafio", nonce, 3), true);
        assert.equal(verifyProofOfWork("outro-desafio", nonce, 3), false);
    });
});

describe("LoginRateLimiter", () => {
    it("bloqueia na quinta falha e libera quando a janela expira", () => {
        const limiter = new LoginRateLimiter({ maxFailures: 5, windowMs: 1000 });
        const start = new Date(0);
        for (let i = 0; i < 4; i++) limiter.recordFailure("k", start);
        assert.equal(limiter.isBlocked("k", start), false);
        limiter.recordFailure("k", start);
        assert.equal(limiter.isBlocked("k", start), true);
        assert.equal(limiter.isBlocked("k", new Date(1000)), false);
    });
});
