import { AccountStatus } from "../dominio/account.ts";
import type {
    AuthenticationContext,
    AuthenticationOutcome,
    RejectionReason,
} from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

const BLOCKED: Readonly<Record<string, { reason: RejectionReason; detail: string }>> = {
    [AccountStatus.SUSPENDED]: {
        reason: "ACCOUNT_SUSPENDED",
        detail: "conta suspensa pela equipe de confiança",
    },
    [AccountStatus.DEACTIVATED]: { reason: "ACCOUNT_DEACTIVATED", detail: "conta desativada pelo titular" },
    [AccountStatus.PENDING_VERIFICATION]: {
        reason: "EMAIL_NOT_VERIFIED",
        detail: "e-mail ainda não verificado",
    },
};

/**
 * ConcreteHandler — estado da conta (`AccountStatus` da Entrega 02). Vem **depois**
 * da senha: só quem prova a senha descobre que a conta está suspensa.
 */
export class AccountStatusHandler extends AbstractAuthenticationHandler {
    readonly name = "AccountStatusHandler";

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const account = context.account;
        if (!account) {
            return context.reject(
                this.name,
                "UNHANDLED",
                "cadeia montada sem localizar a conta antes deste elo",
            );
        }
        const blocked = BLOCKED[account.status];
        if (blocked) return context.reject(this.name, blocked.reason, blocked.detail);
        return super.handle(context);
    }
}
