import { ModerationDecision } from "../moderation/ModerationDecision";
import type { ModerationVerdict } from "../moderation/ModerationVerdict";
import type { ChatMessage } from "./ChatMessage";

export interface QuarantineEntry {
  readonly message: Readonly<ChatMessage>;
  readonly verdict: Readonly<ModerationVerdict>;
  readonly enqueuedAt: string;
}

export class QuarantineQueue {
  private readonly entries: QuarantineEntry[] = [];

  public enqueue(
    message: ChatMessage,
    verdict: ModerationVerdict,
  ): void {
    if (verdict.decision !== ModerationDecision.QUARANTINED) {
      throw new Error(
        "A quarentena aceita somente mensagens com decisão QUARANTINED.",
      );
    }

    const entry: QuarantineEntry = Object.freeze({
      message: Object.freeze({ ...message }),
      verdict: Object.freeze({ ...verdict }),
      enqueuedAt: new Date().toISOString(),
    });

    this.entries.push(entry);
  }

  public getEntries(): ReadonlyArray<QuarantineEntry> {
    return [...this.entries];
  }
}