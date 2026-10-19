import { type AuditLogger, SecurityEventType } from "./dominio/audit-log.ts";
import {
    AuthenticationContext,
    type AuthenticationOutcome,
    type AuthenticationRequest,
} from "./cadeia/authentication-context.ts";
import type { AuthenticationHandler } from "./cadeia/authentication-handler.ts";

export interface LoginServiceDependencies {
    readonly loginChain: AuthenticationHandler;
    readonly stepUpChain: AuthenticationHandler;
    readonly audit: AuditLogger;
    readonly clock?: () => Date;
}

/**
 * Participante **Client** do GoF: entrega a requisição ao primeiro elo e não sabe
 * qual elo vai respondê-la. Também registra o resultado na trilha de auditoria
 * (`IAuditLogger` da Entrega 02), o que não é responsabilidade de nenhum elo.
 */
export class LoginService {
    readonly #loginChain: AuthenticationHandler;
    readonly #stepUpChain: AuthenticationHandler;
    readonly #audit: AuditLogger;
    readonly #clock: () => Date;

    constructor(deps: LoginServiceDependencies) {
        this.#loginChain = deps.loginChain;
        this.#stepUpChain = deps.stepUpChain;
        this.#audit = deps.audit;
        this.#clock = deps.clock ?? (() => new Date());
    }

    login(request: AuthenticationRequest): AuthenticationOutcome {
        const context = new AuthenticationContext(request, this.#clock());
        const outcome = this.#loginChain.handle(context);
        if (outcome.status === "AUTHENTICATED") {
            this.#record(SecurityEventType.LOGIN_SUCCESS, context, { sessionId: outcome.session.id });
        } else if (outcome.status === "REJECTED") {
            this.#record(SecurityEventType.LOGIN_FAILURE, context, {
                reason: outcome.reason,
                rejectedBy: outcome.rejectedBy,
            });
        }
        return outcome;
    }

    confirmStepUp(request: AuthenticationRequest): AuthenticationOutcome {
        const context = new AuthenticationContext(request, this.#clock());
        const outcome = this.#stepUpChain.handle(context);
        if (outcome.status === "STEP_UP_GRANTED") {
            this.#record(SecurityEventType.STEP_UP_CHALLENGE_SUCCESS, context, {
                trigger: outcome.challenge.trigger,
            });
        } else {
            const reason = outcome.status === "REJECTED" ? outcome.reason : outcome.status;
            this.#record(SecurityEventType.STEP_UP_CHALLENGE_FAILED, context, { reason });
        }
        return outcome;
    }

    #record(
        eventType: SecurityEventType,
        context: AuthenticationContext,
        metadata: Record<string, string>,
    ): void {
        this.#audit.log({
            eventType,
            targetEmail: context.request.email,
            ipAddress: context.request.clientIp,
            timestamp: context.now,
            metadata,
        });
    }
}
