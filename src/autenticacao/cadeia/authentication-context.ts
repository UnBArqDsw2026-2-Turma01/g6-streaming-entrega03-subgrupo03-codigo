import type { Account } from "../dominio/account.ts";
import type { ClientIntegrityAttestation } from "../dominio/client-integrity-attestation.ts";
import type { Session } from "../dominio/session.ts";
import type { StepUpAuthChallenge } from "../dominio/step-up-auth-challenge.ts";

/** A requisição que percorre a cadeia (o `request` do GoF). */
export interface AuthenticationRequest {
    readonly email: string;
    readonly password: string;
    readonly totpCode?: string;
    readonly clientIp: string;
    readonly userAgent: string;
    readonly attestation?: ClientIntegrityAttestation;
    /** Só na cadeia de step-up: o desafio que a reautenticação vai concluir. */
    readonly stepUpChallenge?: StepUpAuthChallenge;
}

export type RejectionReason =
    | "RATE_LIMITED"
    | "CLIENT_INTEGRITY_FAILED"
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_SUSPENDED"
    | "ACCOUNT_DEACTIVATED"
    | "EMAIL_NOT_VERIFIED"
    | "MFA_ENROLLMENT_REQUIRED"
    | "INVALID_TOTP"
    | "STEP_UP_INVALID"
    | "UNHANDLED";

/** Marcas que um elo deixa sem interromper a cadeia. */
export type AuthenticationFlag = "PASSWORD_CHANGE_REQUIRED";

interface OutcomeBase {
    /** Elos que deixaram a requisição passar, na ordem. */
    readonly trail: readonly string[];
}

export interface Authenticated extends OutcomeBase {
    readonly status: "AUTHENTICATED";
    readonly account: Account;
    readonly session: Session;
    readonly accessToken: string;
    readonly flags: readonly AuthenticationFlag[];
}

export interface ChallengeRequired extends OutcomeBase {
    readonly status: "CHALLENGE";
    readonly challenge: "TOTP_REQUIRED";
    readonly issuedBy: string;
}

export interface StepUpGranted extends OutcomeBase {
    readonly status: "STEP_UP_GRANTED";
    readonly challenge: StepUpAuthChallenge;
}

export interface Rejected extends OutcomeBase {
    readonly status: "REJECTED";
    readonly reason: RejectionReason;
    readonly rejectedBy: string;
    readonly detail: string;
}

export type AuthenticationOutcome = Authenticated | ChallengeRequired | StepUpGranted | Rejected;

/**
 * Estado compartilhado pelos elos durante uma tentativa: a requisição, o instante
 * de referência e o que cada elo já descobriu (a conta, as marcas).
 */
export class AuthenticationContext {
    readonly request: AuthenticationRequest;
    readonly now: Date;
    account: Account | null = null;
    readonly flags = new Set<AuthenticationFlag>();
    readonly #trail: string[] = [];

    constructor(request: AuthenticationRequest, now: Date) {
        this.request = request;
        this.now = new Date(now);
    }

    get trail(): readonly string[] {
        return [...this.#trail];
    }

    markPassed(handlerName: string): void {
        this.#trail.push(handlerName);
    }

    reject(rejectedBy: string, reason: RejectionReason, detail: string): Rejected {
        return { status: "REJECTED", reason, rejectedBy, detail, trail: this.trail };
    }
}
