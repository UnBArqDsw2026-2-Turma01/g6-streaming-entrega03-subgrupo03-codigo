import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';

/**
 * Observador de Notificação do Kick.com
 * Embasamento Técnico:
 * - Infraestrutura de WebSockets distribuídos via Pusher Channels (wss://ws-us2.pusher.com/app/...)
 * - Evento Laravel Broadcast: "App\\Events\\LivestreamUpdated" no canal "channel.{channel_id}"
 */
export class KickPusherChannelObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Kick.com (Pusher WebSockets)';
  private readonly pusherChannel: string;
  private readonly simulatedLatencyMs: number;

  constructor(id: string, name: string, channelSlug: string, simulatedLatencyMs = 15) {
    this.id = id;
    this.name = name;
    this.pusherChannel = `channel.${channelSlug}`;
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async update(event: StreamEvent): Promise<void> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (event.type === 'STREAM_STARTED') {
      console.log(
        `\x1b[32m[Kick Pusher]\x1b[0m ⚡ WebSocket broadcast no canal [${this.pusherChannel}]: ` +
        `Evento "App\\Events\\LivestreamUpdated" -> "${event.payload.streamerName}" ON jogando ${event.payload.category}!`
      );
    } else if (event.type === 'STREAM_METADATA_UPDATED') {
      console.log(
        `\x1b[32m[Kick Pusher]\x1b[0m 🔄 WebSocket update [${this.pusherChannel}]: Nova categoria: ${event.payload.category}`
      );
    }
  }
}
