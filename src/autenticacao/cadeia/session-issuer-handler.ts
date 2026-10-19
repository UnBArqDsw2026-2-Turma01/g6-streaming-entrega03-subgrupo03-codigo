import { randomUUID } from "node:crypto";
import { type HmacTokenService, Session, type SessionStore } from "../dominio/session.ts";
import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

export interface SessionIssuerOptions {
    readonly ttlMs: number;
    readonly nextId: () => string;
}

const DEFAULT_OPTIONS: SessionIssuerOptions = { ttlMs: 4 * 60 * 60 * 1000, nextId: randomUUID };

/**
 * ConcreteHandler terminal da cadeia de login: cria a `Session`, emite o token e
 * responde. Não chama `super.handle()`: é o elo que de fato trata a requisição.
 */
export class SessionIssuerHandler extends AbstractAuthenticationHandler {
    readonly name = "SessionIssuerHandler";
    readonly #sessions: SessionStore;
    readonly #tokens: HmacTokenService;
    readonly #options: SessionIssuerOptions;

    constructor(
        sessions: SessionStore,
        tokens: HmacTokenService,
        options: Partial<SessionIssuerOptions> = {},
    ) {
        super();
        this.#sessions = sessions;
        this.#tokens = tokens;
        this.#options = { ...DEFAULT_OPTIONS, ...options };
    }

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const account = context.account;
        if (!account) {
            return context.reject(
                this.name,
                "UNHANDLED",
                "cadeia montada sem localizar a conta antes deste elo",
            );
        }
        const session = new Session({
            id: this.#options.nextId(),
            accountId: account.id,
            ipAddress: context.request.clientIp,
            userAgent: context.request.userAgent,
            createdAt: context.now,
            expiresAt: new Date(context.now.getTime() + this.#options.ttlMs),
        });
        this.#sessions.saveSession(session);
        context.markPassed(this.name);
        return {
            status: "AUTHENTICATED",
            account,
            session,
            accessToken: this.#tokens.issue(session, account),
            flags: [...context.flags],
            trail: context.trail,
        };
    }
}
