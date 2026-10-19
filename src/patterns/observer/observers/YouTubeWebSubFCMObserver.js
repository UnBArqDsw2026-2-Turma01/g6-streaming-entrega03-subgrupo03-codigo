/**
 * Observador de Notificação do YouTube Live
 * Embasamento Técnico:
 * - Protocolo Google WebSub (PubSubHubbub em https://pubsubhubbub.appspot.com/)
 * - Dispatcher em lote via Firebase Cloud Messaging (FCM) para inscritos com o "Sininho" ativado.
 */
export class YouTubeWebSubFCMObserver {
    id;
    name;
    targetSystem = 'YouTube Live (WebSub / Google FCM)';
    hubTopicUrl;
    simulatedLatencyMs;
    constructor(id, name, channelId, simulatedLatencyMs = 20) {
        this.id = id;
        this.name = name;
        this.hubTopicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
        this.simulatedLatencyMs = simulatedLatencyMs;
    }
    async update(event) {
        if (this.simulatedLatencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
        }
        if (event.type === 'STREAM_STARTED') {
            console.log(`\x1b[31m[YouTube Live]\x1b[0m 🔔 WebSub Atom Feed atualizado (${this.hubTopicUrl}) ` +
                `-> Disparando Push FCM: "${event.payload.streamerName} está AO VIVO: ${event.payload.title}"`);
        }
        else if (event.type === 'STREAM_ENDED') {
            console.log(`\x1b[31m[YouTube Live]\x1b[0m ⏹ WebSub Feed: Transmissão encerrada. Gravando VoD no canal.`);
        }
    }
}
