import type { Credential } from "./credential.ts";
import type { TwoFactorAuth } from "./two-factor-auth.ts";

/** Mesmos valores do enum `AccountStatus` do diagrama da Entrega 02. */
export const AccountStatus = {
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    PENDING_VERIFICATION: "PENDING_VERIFICATION",
    DEACTIVATED: "DEACTIVATED",
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

/**
 * Recorte do RBAC da Entrega 02: só importa aqui se a conta pode transmitir,
 * porque o conflito C03 da Entrega 01 exige MFA de criadores e não de espectadores.
 */
export type AccountRole = "VIEWER" | "CREATOR";

export interface AccountFields {
    readonly id: string;
    readonly email: string;
    readonly role: AccountRole;
    readonly status: AccountStatus;
    readonly credential: Credential;
    readonly twoFactor?: TwoFactorAuth | null;
}

export class Account {
    readonly id: string;
    readonly email: string;
    readonly role: AccountRole;
    readonly credential: Credential;
    readonly twoFactor: TwoFactorAuth | null;
    #status: AccountStatus;

    constructor(fields: AccountFields) {
        this.id = fields.id;
        this.email = Account.normalizeEmail(fields.email);
        this.role = fields.role;
        this.credential = fields.credential;
        this.twoFactor = fields.twoFactor ?? null;
        this.#status = fields.status;
    }

    static normalizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }

    get status(): AccountStatus {
        return this.#status;
    }

    setStatus(status: AccountStatus): void {
        this.#status = status;
    }

    /** C03 (Entrega 01): MFA obrigatório para quem transmite. */
    requiresMfa(): boolean {
        return this.role === "CREATOR";
    }

    hasTwoFactorEnabled(): boolean {
        return this.twoFactor?.isEnabled === true;
    }
}

export interface AccountRepository {
    findByEmail(email: string): Account | null;
}

export class InMemoryAccountRepository implements AccountRepository {
    readonly #byEmail = new Map<string, Account>();

    constructor(accounts: readonly Account[] = []) {
        for (const account of accounts) this.save(account);
    }

    save(account: Account): void {
        this.#byEmail.set(account.email, account);
    }

    findByEmail(email: string): Account | null {
        return this.#byEmail.get(Account.normalizeEmail(email)) ?? null;
    }
}
