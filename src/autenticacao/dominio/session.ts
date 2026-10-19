import { createHmac, timingSafeEqual } from "node:crypto";
import type { Account } from "./account.ts";

export interface SessionFields {
    readonly id: string;
    readonly accountId: string;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
}

/** `Session` do diagrama da Entrega 02. */
export class Session {
    readonly id: string;
    readonly accountId: string;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly createdAt: Date;
    readonly expiresAt: Date;
    #isRevoked = false;

    constructor(fields: SessionFields) {
        this.id = fields.id;
        this.accountId = fields.accountId;
        this.ipAddress = fields.ipAddress;
        this.userAgent = fields.userAgent;
        this.createdAt = new Date(fields.createdAt);
        this.expiresAt = new Date(fields.expiresAt);
    }

    get isRevoked(): boolean {
        return this.#isRevoked;
    }

    revoke(): void {
        this.#isRevoked = true;
    }

    isExpired(at: Date): boolean {
        return at.getTime() >= this.expiresAt.getTime();
    }
}

/** Recorte de `IDistributedSessionStore` da Entrega 02. */
export interface SessionStore {
    saveSession(session: Session): void;
}

export class InMemorySessionStore implements SessionStore {
    readonly sessions: Session[] = [];

    saveSession(session: Session): void {
        this.sessions.push(session);
    }
}

/** `AccessTokenPayload` da Entrega 02, só com as reivindicações usadas aqui. */
export interface AccessTokenPayload {
    readonly sub: string;
    readonly sessionId: string;
    readonly role: string;
    readonly iat: number;
    readonly exp: number;
}

function base64url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
}

/**
 * Recorte de `ITokenService` da Entrega 02: emite um JWT compacto assinado com
 * HMAC-SHA-256 (RFC 7519 e RFC 7515). Rotação de refresh token fica fora do recorte.
 */
export class HmacTokenService {
    readonly #secret: Buffer;

    constructor(secret: Buffer) {
        this.#secret = secret;
    }

    issue(session: Session, account: Account): string {
        const payload: AccessTokenPayload = {
            sub: account.id,
            sessionId: session.id,
            role: account.role,
            iat: Math.floor(session.createdAt.getTime() / 1000),
            exp: Math.floor(session.expiresAt.getTime() / 1000),
        };
        const unsigned = `${base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64url(JSON.stringify(payload))}`;
        return `${unsigned}.${this.#sign(unsigned)}`;
    }

    verify(token: string, at: Date): AccessTokenPayload | null {
        const [header, payload, signature] = token.split(".");
        if (!header || !payload || !signature) return null;
        const expected = Buffer.from(this.#sign(`${header}.${payload}`));
        const received = Buffer.from(signature);
        if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AccessTokenPayload;
        return claims.exp * 1000 > at.getTime() ? claims : null;
    }

    #sign(unsigned: string): string {
        return createHmac("sha256", this.#secret).update(unsigned).digest("base64url");
    }
}
