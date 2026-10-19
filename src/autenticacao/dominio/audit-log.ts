/** Subconjunto do enum `SecurityEventType` da Entrega 02 usado pela autenticação. */
export const SecurityEventType = {
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILURE: "LOGIN_FAILURE",
    STEP_UP_CHALLENGE_SUCCESS: "STEP_UP_CHALLENGE_SUCCESS",
    STEP_UP_CHALLENGE_FAILED: "STEP_UP_CHALLENGE_FAILED",
} as const;
export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType];

export interface AuditLogEntry {
    readonly eventType: SecurityEventType;
    readonly targetEmail: string;
    readonly ipAddress: string;
    readonly timestamp: Date;
    readonly metadata: Readonly<Record<string, string>>;
}

/** Recorte de `IAuditLogger` da Entrega 02. */
export interface AuditLogger {
    log(entry: AuditLogEntry): void;
}

export class InMemoryAuditLogger implements AuditLogger {
    readonly entries: AuditLogEntry[] = [];

    log(entry: AuditLogEntry): void {
        this.entries.push(entry);
    }
}
