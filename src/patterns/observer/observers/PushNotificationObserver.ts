import { IObserver, StreamEvent } from '../interfaces.js';

/**
 * ConcreteObserver 1 (GoF Observer - Slide 53)
 * Notificação Push para aplicativos móveis da Twitch (iOS / Android).
 */
export class PushNotificationObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Twitch Mobile App (Push)';
  private readonly deviceToken: string;
  private readonly simulatedLatencyMs: number;

  constructor(id: string, name: string, deviceToken: string, simulatedLatencyMs = 15) {
    this.id = id;
    this.name = name;
    this.deviceToken = deviceToken;
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async update(event: StreamEvent): Promise<void> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (event.type === 'STREAM_STARTED') {
      console.log(
        `\x1b[35m[Twitch Mobile App]\x1b[0m 🔔 Dispositivo [${this.deviceToken.slice(0, 10)}...]: ` +
        `🔴 ${event.payload.streamerName} está transmitindo ${event.payload.category}! Assista em: ${event.payload.streamUrl}`
      );
    }
  }
}
