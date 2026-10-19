import { IObserver, StreamEvent } from '../interfaces.js';

/**
 * ConcreteObserver 2 (GoF Observer - Slide 53)
 * Envio de e-mails transacionais para seguidores que marcaram a opção de receber alerta no e-mail.
 */
export class EmailNotificationObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Twitch Mailer';
  private readonly targetEmail: string;
  private readonly simulatedLatencyMs: number;

  constructor(id: string, name: string, targetEmail: string, simulatedLatencyMs = 25) {
    this.id = id;
    this.name = name;
    this.targetEmail = targetEmail;
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async update(event: StreamEvent): Promise<void> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (event.type === 'STREAM_STARTED') {
      console.log(
        `\x1b[36m[Twitch Email]\x1b[0m 📧 Enviado para <${this.targetEmail}>: ` +
        `"${event.payload.streamerName}" acabou de entrar ao vivo: "${event.payload.title}" jogando ${event.payload.category}!`
      );
    } else if (event.type === 'STREAM_ENDED') {
      console.log(
        `\x1b[36m[Twitch Email]\x1b[0m 📧 Enviado para <${this.targetEmail}>: Resumo da transmissão de "${event.payload.streamerName}".`
      );
    }
  }
}
