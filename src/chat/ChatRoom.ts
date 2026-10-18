import { ModerationDecision } from "../moderation/ModerationDecision";
import type { AutoModPipeline } from "../moderation/AutoModPipeline";
import type { ChatMessage } from "./ChatMessage";
import type { ChatObserver } from "./ChatObserver";
import type { ChatAuditService } from "./ChatAuditService";
import type { QuarantineQueue } from "./QuarantineQueue";

export class ChatRoom {
    private readonly observers: ChatObserver[] = [];

    constructor(
        private readonly autoMod: AutoModPipeline,
        private readonly audit: ChatAuditService,
        private readonly quarantine: QuarantineQueue,
    ){}

    public subscribe(observer: ChatObserver): void {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    public unsubscribe(observer: ChatObserver): void {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }

    public publish(message: ChatMessage): void {
        const verdict = this.autoMod.inspectMessage(message);

        this.audit.record(message, verdict);

        switch (verdict.decision) {
            case ModerationDecision.APPROVED:
                this.notify(message);
                return;
            
            case ModerationDecision.QUARANTINED:
                this.quarantine.enqueue(message, verdict);
                return;
            
            case ModerationDecision.REJECTED:
                return;
            
            default:
                throw new Error("Decisão de moderação desconhecida!");
        }
    }

    private notify(message: ChatMessage): void {

        const subscribers = [...this.observers];

        for (const observer of subscribers) {
            observer.update(message);
        }
    }
}