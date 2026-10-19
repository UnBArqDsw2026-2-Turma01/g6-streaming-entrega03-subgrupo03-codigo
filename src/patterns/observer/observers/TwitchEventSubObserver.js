/**
 * Observador de Notificação da Twitch
 * Embasamento Técnico:
 * - Twitch EventSub API (WebSockets e Webhooks de assinatura de eventos de canal)
 * - Tópicos: "stream.online" e "channel.update"
 */
export class TwitchEventSubObserver {
    id;
    name;
    targetSystem = 'Twitch EventSub';
    simulatedLatencyMs;
    constructor(id, name, simulatedLatencyMs = 18) {
        this.id = id;
        this.name = name;
        this.simulatedLatencyMs = simulatedLatencyMs;
    }
    async update(event) {
        if (this.simulatedLatencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
        }
        if (event.type === 'STREAM_STARTED') {
            console.log(`\x1b[35m[Twitch EventSub]\x1b[0m 🟣 Evento "stream.online" despachado: ` +
                `https://twitch.tv/${event.payload.channelId} | Viewers: ${event.payload.viewerCount}`);
        }
        else if (event.type === 'STREAM_ENDED') {
            console.log(`\x1b[35m[Twitch EventSub]\x1b[0m 🟣 Evento "stream.offline" despachado para os clientes conectados.`);
        }
    }
}
