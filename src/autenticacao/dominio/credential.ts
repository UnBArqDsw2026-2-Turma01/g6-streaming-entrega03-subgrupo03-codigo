import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Parâmetros do scrypt (RFC 7914). O padrão segue o mínimo recomendado pelo
 * OWASP Password Storage Cheat Sheet (N = 2^17, r = 8, p = 1).
 */
export interface ScryptParams {
    readonly N: number;
    readonly r: number;
    readonly p: number;
}

export const OWASP_SCRYPT_PARAMS: ScryptParams = { N: 2 ** 17, r: 8, p: 1 };

const KEY_LENGTH = 64;

function derive(plainText: string, salt: Buffer, params: ScryptParams): Buffer {
    // maxmem precisa caber 128 * N * r bytes; o padrão do Node (32 MiB) não comporta N = 2^17.
    const maxmem = 256 * params.N * params.r;
    return scryptSync(plainText, salt, KEY_LENGTH, { ...params, maxmem });
}

/**
 * `Credential` do diagrama de autenticação da Entrega 02. O modelo previa Argon2id
 * (objetivo O06 da Entrega 01); o Node 22 não traz Argon2 no módulo `crypto`, então
 * esta implementação usa scrypt, a alternativa aceita pelo OWASP quando Argon2id
 * não está disponível. O algoritmo fica registrado em `algorithm`.
 */
export class Credential {
    readonly algorithm = "scrypt";
    readonly salt: Buffer;
    readonly passwordHash: Buffer;
    readonly params: ScryptParams;

    constructor(salt: Buffer, passwordHash: Buffer, params: ScryptParams) {
        this.salt = salt;
        this.passwordHash = passwordHash;
        this.params = params;
    }

    static fromPlainText(plainText: string, params: ScryptParams = OWASP_SCRYPT_PARAMS): Credential {
        const salt = randomBytes(16);
        return new Credential(salt, derive(plainText, salt, params), params);
    }

    /** Comparação em tempo constante, para não vazar quantos bytes coincidem. */
    verifyPassword(plainText: string): boolean {
        const candidate = derive(plainText, this.salt, this.params);
        return timingSafeEqual(candidate, this.passwordHash);
    }
}
