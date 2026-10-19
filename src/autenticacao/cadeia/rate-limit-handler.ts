import { Account } from "../dominio/account.ts";
import type { LoginRateLimiter } from "../dominio/login-rate-limiter.ts";
import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

const CREDENTIAL_FAILURES = new Set(["INVALID_CREDENTIALS", "INVALID_TOTP"]);

/**
 * ConcreteHandler — limite de tentativas (O07 da Entrega 01). É o único elo que
 * age também **na volta**: depois que o restante da cadeia responde, conta a falha
 * de credencial ou zera a janela do e-mail em caso de sucesso.
 */
export class RateLimitHandler extends AbstractAuthenticationHandler {
    readonly name = "RateLimitHandler";
    readonly #limiter: LoginRateLimiter;

    constructor(limiter: LoginRateLimiter) {
        super();
        this.#limiter = limiter;
    }

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const emailKey = `email:${Account.normalizeEmail(context.request.email)}`;
        const ipKey = `ip:${context.request.clientIp}`;
        if (this.#limiter.isBlocked(emailKey, context.now) || this.#limiter.isBlocked(ipKey, context.now)) {
            return context.reject(
                this.name,
                "RATE_LIMITED",
                "muitas tentativas malsucedidas; aguarde a janela expirar",
            );
        }

        const outcome = super.handle(context);

        if (outcome.status === "REJECTED" && CREDENTIAL_FAILURES.has(outcome.reason)) {
            this.#limiter.recordFailure(emailKey, context.now);
            this.#limiter.recordFailure(ipKey, context.now);
        } else if (outcome.status === "AUTHENTICATED" || outcome.status === "STEP_UP_GRANTED") {
            this.#limiter.reset(emailKey);
        }
        return outcome;
    }
}
