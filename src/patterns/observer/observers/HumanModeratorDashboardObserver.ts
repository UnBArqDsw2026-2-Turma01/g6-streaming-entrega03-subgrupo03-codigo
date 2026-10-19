import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';

/**
 * HumanModeratorDashboardObserver (GoF Observer)
 * Painel em tempo real para moderadores humanos do canal.
 * Recebe todos os alertas de segurança, AutoMod e DMCA, permitindo que moderadores
 * aprovem ou revoguem suspensões, apliquem punições (ban/timeout) e acompanhem a live.
 */
export class HumanModeratorDashboardObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Live Moderator Dashboard (ModView)';
  private readonly moderatorHandle: string;
  private actionsExecuted: string[] = [];

  constructor(id: string, name: string, moderatorHandle: string) {
    this.id = id;
    this.name = name;
    this.moderatorHandle = moderatorHandle;
  }

  update(event: StreamEvent): void {
    if (event.type === 'CONTENT_SAFETY_VIOLATION' || event.type === 'COPYRIGHT_DMCA_DETECTED' || event.type === 'AUTOMOD_FLAGGED') {
      const summary = `[${event.type}] no canal @${event.channelId}: ${event.moderationInfo?.flagType} -> Ação: ${event.moderationInfo?.actionApplied}`;
      this.actionsExecuted.push(summary);
      console.log(
        `\x1b[36m[ModView - @${this.moderatorHandle}]\x1b[0m 👮 Feed de Moderação Humana atualizado: ` +
        `Notificação de incidente recebida para auditoria manual imediata.`
      );
    } else if (event.type === 'MODERATOR_ACTION_TAKEN') {
      const summary = `[${event.type}] no canal @${event.channelId}: ${event.moderationInfo?.actionApplied}`;
      this.actionsExecuted.push(summary);
      console.log(
        `\x1b[36m[ModView - @${this.moderatorHandle}]\x1b[0m 🔨 Ação Manual Executada: ` +
        `${event.moderationInfo?.actionApplied} pelo moderador @${this.moderatorHandle}.`
      );
    }
  }

  public getActionsHistory(): string[] {
    return [...this.actionsExecuted];
  }
}
