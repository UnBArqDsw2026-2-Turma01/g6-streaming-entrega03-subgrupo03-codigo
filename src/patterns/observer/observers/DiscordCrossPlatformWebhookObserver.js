export class DiscordCrossPlatformWebhookObserver {
    id;
    name;
    targetSystem = 'Discord Community Bot';
    webhookUrl;
    guildName;
    simulatedLatencyMs;
    constructor(id, name, guildName, webhookUrl, simulatedLatencyMs = 25) {
        this.id = id;
        this.name = name;
        this.guildName = guildName;
        this.webhookUrl = webhookUrl;
        this.simulatedLatencyMs = simulatedLatencyMs;
    }
    async update(event) {
        if (this.simulatedLatencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
        }
        const platformBadge = event.platform === 'YOUTUBE_LIVE' ? '🔴 [YouTube Live]' :
            event.platform === 'KICK' ? '🟢 [Kick.com]' : '🟣 [Twitch]';
        if (event.type === 'STREAM_STARTED') {
            console.log(`\x1b[34m[Discord Bot]\x1b[0m 🤖 Servidor "${this.guildName}": ` +
                `@everyone ${platformBadge} ${event.payload.streamerName} está ON! ` +
                `"${event.payload.title}" (${event.payload.category}) -> ${event.payload.streamUrl}`);
        }
        else if (event.type === 'STREAM_METADATA_UPDATED') {
            console.log(`\x1b[34m[Discord Bot]\x1b[0m 🔄 Servidor "${this.guildName}": ` +
                `${platformBadge} Atualização de categoria: ${event.payload.category}`);
        }
    }
}
