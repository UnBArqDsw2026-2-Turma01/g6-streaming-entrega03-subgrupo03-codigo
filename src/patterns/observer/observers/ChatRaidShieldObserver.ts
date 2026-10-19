import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';
import { ChatRaidVelocityFilter, ChatMessageRecord, RaidDetectionResult } from '../../../engine/algorithms/ChatRaidVelocityFilter.js';

/**
 * ChatRaidShieldObserver (GoF Observer)
 * Monitoramento de integridade de chat via Análise de Velocidade em Janela Deslizante
 * e agrupamento de similaridade de Levenshtein.
 * Ao detectar uma invasão de bots ("Hate Raid"), ativa o Shield Mode (modo seguidores/subs).
 */
export class ChatRaidShieldObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Twitch / Kick Shield Mode Protection Engine';
  private messageHistory: ChatMessageRecord[] = [];
  private isShieldModeActive = false;
  private totalRaidsBlocked = 0;
  private lastRaidReport?: RaidDetectionResult;

  constructor(id: string = 'obs-chat-raid', name: string = 'Chat Raid Shield Observer') {
    this.id = id;
    this.name = name;
  }

  update(event: StreamEvent): void {
    if (event.type === 'CHAT_MESSAGE_SENT' && event.moderationInfo) {
      const record: ChatMessageRecord = {
        sender: event.moderationInfo.moderatorId || 'viewer',
        message: event.moderationInfo.detectedEntity,
        timestamp: Date.now()
      };

      this.messageHistory.push(record);

      // Mantém histórico recente (últimos 10 segundos)
      const cutoff = Date.now() - 10000;
      this.messageHistory = this.messageHistory.filter(m => m.timestamp >= cutoff);

      const report = ChatRaidVelocityFilter.analyzeWindow(this.messageHistory, 5000);
      this.lastRaidReport = report;

      if (report.isRaidDetected && !this.isShieldModeActive) {
        this.isShieldModeActive = true;
        this.totalRaidsBlocked++;

        console.log(
          `\x1b[45m\x1b[37m[SHIELD MODE - ATIVAÇÃO DE DEFESA DE CHAT]\x1b[0m 🛡️ Ataque Coordenado no canal [@${event.channelId}]:\n` +
          `   - Velocidade Detectada: ${report.velocityMsgPerSec} msg/s (Limite: 8 msg/s)\n` +
          `   - Taxa de Similaridade de Bots (Levenshtein): ${(report.duplicateClusterRatio * 100).toFixed(0)}%\n` +
          `   - Ação Executada: Ativação Automática de Shield Mode (Subscribers & Emotes Only).`
        );
      }
    }
  }

  public getShieldModeStatus(): boolean {
    return this.isShieldModeActive;
  }

  public getRaidsBlockedCount(): number {
    return this.totalRaidsBlocked;
  }

  public getLastReport(): RaidDetectionResult | undefined {
    return this.lastRaidReport;
  }
}
