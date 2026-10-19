import type { AccountRepository } from "../dominio/account.ts";
import { Credential, OWASP_SCRYPT_PARAMS, type ScryptParams } from "../dominio/credential.ts";
import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

const GENERIC_DETAIL = "e-mail ou senha incorretos";

/**
 * ConcreteHandler — localiza a conta e confere a senha. E-mail inexistente e senha
 * errada recebem **a mesma** recusa e o mesmo custo de hash (com uma credencial
 * fictícia), para não revelar quais e-mails têm conta (OWASP Authentication Cheat Sheet).
 */
export class PasswordHandler extends AbstractAuthenticationHandler {
    readonly name = "PasswordHandler";
    readonly #accounts: AccountRepository;
    readonly #dummy: Credential;

    constructor(accounts: AccountRepository, scryptParams: ScryptParams = OWASP_SCRYPT_PARAMS) {
        super();
        this.#accounts = accounts;
        this.#dummy = Credential.fromPlainText("credencial-ficticia", scryptParams);
    }

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const account = this.#accounts.findByEmail(context.request.email);
        const credential = account?.credential ?? this.#dummy;
        const matches = credential.verifyPassword(context.request.password);
        if (!account || !matches) {
            return context.reject(this.name, "INVALID_CREDENTIALS", GENERIC_DETAIL);
        }
        context.account = account;
        return super.handle(context);
    }
}
