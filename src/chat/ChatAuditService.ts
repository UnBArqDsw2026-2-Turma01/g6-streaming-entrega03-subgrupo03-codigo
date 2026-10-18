import type { ModerationVerdict } from "../moderation/ModerationVerdict";
import type { ChatMessage } from "./ChatMessage";

export interface ChatAuditRecord {
    readonly message: Readonly<ChatMessage>;
    readonly verdict: Readonly<ModerationVerdict>;
    readonly recordedAt: string;
}

export class ChatAuditService {
    private readonly records: ChatAuditRecord[] = [];

    public record(
        message: ChatMessage,
        verdict: ModerationVerdict,
    ): void {
        const entry: ChatAuditRecord = Object.freeze({
            message: Object.freeze({ ...message }),
            verdict: Object.freeze({ ...verdict }),
            recordedAt: new Date().toISOString(),
        });

        this.records.push(entry);
    }

    public getRecords(): ReadonlyArray<ChatAuditRecord> {
        return [...this.records];
    }
}