import { verifyProofOfWork } from "../dominio/client-integrity-attestation.ts";
import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

export interface ClientIntegrityOptions {
    readonly minDifficulty: number;
    readonly maxAgeMs: number;
}

export const DEFAULT_CLIENT_INTEGRITY_OPTIONS: ClientIntegrityOptions = {
    minDifficulty: 3,
    maxAgeMs: 2 * 60 * 1000,
};

/**
 * ConcreteHandler — atestação do cliente (DE01 da Entrega 02). Fica antes da
 * verificação de senha para que clientes automatizados não cheguem ao hash, que
 * é a etapa cara da cadeia.
 */
export class ClientIntegrityHandler extends AbstractAuthenticationHandler {
    readonly name = "ClientIntegrityHandler";
    readonly #options: ClientIntegrityOptions;

    constructor(options: ClientIntegrityOptions = DEFAULT_CLIENT_INTEGRITY_OPTIONS) {
        super();
        this.#options = options;
    }

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const attestation = context.request.attestation;
        if (!attestation) {
            return context.reject(this.name, "CLIENT_INTEGRITY_FAILED", "atestação do cliente ausente");
        }
        if (attestation.hasWebDriverFlag) {
            return context.reject(
                this.name,
                "CLIENT_INTEGRITY_FAILED",
                "navegador automatizado (webdriver) detectado",
            );
        }
        if (context.now.getTime() - attestation.issuedAt.getTime() > this.#options.maxAgeMs) {
            return context.reject(this.name, "CLIENT_INTEGRITY_FAILED", "atestação expirada");
        }
        if (
            attestation.difficulty < this.#options.minDifficulty ||
            !verifyProofOfWork(attestation.challenge, attestation.proofOfWorkNonce, attestation.difficulty)
        ) {
            return context.reject(this.name, "CLIENT_INTEGRITY_FAILED", "prova de trabalho inválida");
        }
        return super.handle(context);
    }
}
