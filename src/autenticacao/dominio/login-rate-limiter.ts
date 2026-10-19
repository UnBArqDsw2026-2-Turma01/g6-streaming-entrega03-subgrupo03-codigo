export interface RateLimitPolicy {
    readonly maxFailures: number;
    readonly windowMs: number;
}

/** Valores de referência: 5 falhas por chave em 15 minutos. */
export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = { maxFailures: 5, windowMs: 15 * 60 * 1000 };

interface Window {
    startedAt: number;
    failures: number;
}

/**
 * Limite de tentativas do objetivo O07 da Entrega 01 (proteção do login contra
 * credential stuffing). Janela fixa por chave; a chave pode ser o e-mail ou o IP.
 */
export class LoginRateLimiter {
    readonly policy: RateLimitPolicy;
    readonly #windows = new Map<string, Window>();

    constructor(policy: RateLimitPolicy = DEFAULT_RATE_LIMIT_POLICY) {
        this.policy = policy;
    }

    isBlocked(key: string, at: Date): boolean {
        const window = this.#current(key, at);
        return window !== null && window.failures >= this.policy.maxFailures;
    }

    recordFailure(key: string, at: Date): void {
        const window = this.#current(key, at);
        if (window) window.failures++;
        else this.#windows.set(key, { startedAt: at.getTime(), failures: 1 });
    }

    reset(key: string): void {
        this.#windows.delete(key);
    }

    #current(key: string, at: Date): Window | null {
        const window = this.#windows.get(key);
        if (!window) return null;
        if (at.getTime() - window.startedAt >= this.policy.windowMs) {
            this.#windows.delete(key);
            return null;
        }
        return window;
    }
}
