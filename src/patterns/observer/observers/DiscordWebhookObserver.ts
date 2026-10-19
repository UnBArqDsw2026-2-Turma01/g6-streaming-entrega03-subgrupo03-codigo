import { IObserver, StreamEvent } from '../interfaces.js';

/**
 * ConcreteObserver 3 (GoF Observer - Slide 53)
 * Disparo para webhook de bots em servidores de comunidade do streamer no Discord.
 */
export class DiscordWebhookObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Discord Community Bot';
  private readonly webhookUrl: string;
  private readonly guildName: string;
  private readonly simulatedLatencyMs: number;

  constructor(id: string, name: string, guildName: string, webhookUrl: string, simulatedLatencyMs = 30) {
    this.id = id;
    this.name = name;
    this.guildName = guildName;
    this.webhookUrl = webhookUrl;
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async update(event: StreamEvent): Promise<void> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (event.type === 'STREAM_STARTED') {
      console.log(
        `\x1b[34m[Discord Bot]\x1b[0m 🤖 Servidor "${this.guildName}": ` +
        `@everyone ${event.payload.streamerName} está ON na Twitch! ` +
        `"${event.payload.title}" (${event.payload.category}) -> ${event.payload.streamUrl}`
      );
    } else if (event.type === 'STREAM_METADATA_UPDATED') {
      console.log(
        `\x1b[34m[Discord Bot]\x1b[0m 🔄 Servidor "${this.guildName}": ` +
        `Mudança de Categoria: Agora jogando ${event.payload.category}!`
      );
    }
  }
}
