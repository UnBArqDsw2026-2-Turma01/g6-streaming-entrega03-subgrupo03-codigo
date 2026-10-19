import { IObserver, StreamEvent } from '../interfaces.js';

/**
 * ConcreteObserver 4 (GoF Observer - Slide 53)
 * Atualização em tempo real na interface web da Twitch (badge vermelho "AO VIVO" na barra lateral).
 */
export class InAppLiveBadgeObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Twitch Web Front-End (Sidebar Feed)';
  private isLiveBadgeActive = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  update(event: StreamEvent): void {
    if (event.type === 'STREAM_STARTED') {
      this.isLiveBadgeActive = true;
      console.log(
        `\x1b[32m[Twitch Web Front-End]\x1b[0m 🔴 Badge "AO VIVO" ativado na barra lateral para [${event.payload.channelId}].`
      );
    } else if (event.type === 'STREAM_ENDED') {
      this.isLiveBadgeActive = false;
      console.log(
        `\x1b[32m[Twitch Web Front-End]\x1b[0m ⚫ Badge "AO VIVO" desativado para [${event.payload.channelId}].`
      );
    }
  }

  get isLive(): boolean {
    return this.isLiveBadgeActive;
  }
}
