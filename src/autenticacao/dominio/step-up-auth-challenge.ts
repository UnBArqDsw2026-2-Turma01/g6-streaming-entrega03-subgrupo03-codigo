/** Mesmos valores do enum `StepUpTrigger` do diagrama da Entrega 02. */
export const StepUpTrigger = {
    STREAM_KEY_ROTATION: "STREAM_KEY_ROTATION",
    WALLET_PAYOUT_REQUEST: "WALLET_PAYOUT_REQUEST",
    EMAIL_CHANGE: "EMAIL_CHANGE",
    TWO_FACTOR_RESET: "TWO_FACTOR_RESET",
} as const;
export type StepUpTrigger = (typeof StepUpTrigger)[keyof typeof StepUpTrigger];

export interface StepUpAuthChallengeFields {
    readonly id: string;
    readonly accountId: string;
    readonly trigger: StepUpTrigger;
    readonly expiresAt: Date;
}

/**
 * `StepUpAuthChallenge` da Entrega 02: reautenticação exigida antes de uma ação
 * sensível. Aqui ele é concluído pelo último elo da cadeia de step-up.
 */
export class StepUpAuthChallenge {
    readonly id: string;
    readonly accountId: string;
    readonly trigger: StepUpTrigger;
    readonly expiresAt: Date;
    #isCompleted = false;

    constructor(fields: StepUpAuthChallengeFields) {
        this.id = fields.id;
        this.accountId = fields.accountId;
        this.trigger = fields.trigger;
        this.expiresAt = new Date(fields.expiresAt);
    }

    get isCompleted(): boolean {
        return this.#isCompleted;
    }

    isFresh(at: Date): boolean {
        return !this.#isCompleted && at.getTime() < this.expiresAt.getTime();
    }

    complete(): void {
        this.#isCompleted = true;
    }
}
