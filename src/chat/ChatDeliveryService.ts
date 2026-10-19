import type { ChatMessage } from "./ChatMessage";
import type { ChatObserver } from "./ChatObserver";

export class ChatDeliveryService implements ChatObserver {
    public update(message: ChatMessage): void {
        console.log(
            `[Chat ${message.channelId}] ${message.authorId}: ${message.content}`,
        );
    }
}