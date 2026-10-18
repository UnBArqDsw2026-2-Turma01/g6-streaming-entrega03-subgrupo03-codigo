import type { ChatMessage } from "./ChatMessage";

export interface ChatObserver {
    update(message: ChatMessage): void;
}

/** @deprecated Use ChatObserver. */
export type ChatObserve = ChatObserver;