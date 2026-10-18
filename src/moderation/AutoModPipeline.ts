import type { ChatMessage } from "../chat/ChatMessage";
import type { ModerationVerdict } from "./ModerationVerdict";

export interface AutoModPipeline {
  inspectMessage(message: ChatMessage): ModerationVerdict;
}
