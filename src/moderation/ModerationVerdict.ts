import type { ModerationDecision } from "./ModerationDecision";

export interface ModerationVerdict {
  readonly decision: ModerationDecision;
  readonly reason: string;
}
