export class ChatMessage {
    constructor(
        public readonly messageId: string,
        public readonly channelId: string,
        public readonly authorId: string,
        public readonly content: string,
    ) {}
}