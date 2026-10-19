import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

/**
 * ConcreteHandler terminal da cadeia de step-up: conclui o `StepUpAuthChallenge`
 * da Entrega 02 (rotação de stream key, saque etc.) quando os elos anteriores
 * aprovaram a reautenticação.
 */
export class StepUpGrantHandler extends AbstractAuthenticationHandler {
    readonly name = "StepUpGrantHandler";

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        const account = context.account;
        const challenge = context.request.stepUpChallenge;
        if (!account || !challenge) {
            return context.reject(this.name, "STEP_UP_INVALID", "desafio de step-up ausente");
        }
        if (challenge.accountId !== account.id) {
            return context.reject(this.name, "STEP_UP_INVALID", "desafio pertence a outra conta");
        }
        if (!challenge.isFresh(context.now)) {
            return context.reject(this.name, "STEP_UP_INVALID", "desafio expirado ou já concluído");
        }
        challenge.complete();
        context.markPassed(this.name);
        return { status: "STEP_UP_GRANTED", challenge, trail: context.trail };
    }
}
