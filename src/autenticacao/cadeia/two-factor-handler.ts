import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

export interface TwoFactorOptions {
    /** Exige o segundo fator de qualquer conta, como na cadeia de step-up. */
    readonly alwaysRequire: boolean;
}

/**
 * ConcreteHandler — segundo fator TOTP (O05 e conflito C03 da Entrega 01; gateway
 * "2FA ativa" do BPMN da Entrega 01). Quando falta o código, este elo **trata** a
 * requisição respondendo com um desafio, e a cadeia para aqui.
 */
export class TwoFactorHandler extends AbstractAuthenticationHandler {
    readonly name = "TwoFactorHandler";
    readonly #options: TwoFactorOptions;

    constructor(options: TwoFactorOptions = { alwaysRequire: false }) {
        super();
        this.#options = options;
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
        const required =
            this.#options.alwaysRequire || account.requiresMfa() || account.hasTwoFactorEnabled();
        if (!required) return super.handle(context);

        if (!account.hasTwoFactorEnabled()) {
            return context.reject(
                this.name,
                "MFA_ENROLLMENT_REQUIRED",
                "conta de criador sem segundo fator cadastrado; cadastre um autenticador",
            );
        }
        const code = context.request.totpCode;
        if (code === undefined) {
            return {
                status: "CHALLENGE",
                challenge: "TOTP_REQUIRED",
                issuedBy: this.name,
                trail: context.trail,
            };
        }
        if (!account.twoFactor!.verifyToken(code, context.now)) {
            return context.reject(
                this.name,
                "INVALID_TOTP",
                "código do autenticador inválido ou já utilizado",
            );
        }
        return super.handle(context);
    }
}
