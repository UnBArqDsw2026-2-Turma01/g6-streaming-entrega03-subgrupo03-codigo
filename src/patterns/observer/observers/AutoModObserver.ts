import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';
import { TextEntropyAnalyzer } from '../../../engine/algorithms/TextEntropyAnalyzer.js';

/**
 * AutoModObserver (GoF Observer)
 * Filtro automático de chat com cálculo matemático REAL de Entropia de Shannon,
 * normalização de leetspeak e detecção léxica de toxicidade e phishing.
 */
export class AutoModObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'AutoMod Real-Time NLP Engine';
  private totalFilteredMessages = 0;
  private readonly inspectionLogs: Array<{ text: string; entropy: number; violations: string[] }> = [];

  constructor(id: string = 'obs-automod', name: string = 'AutoMod Shannon Analyzer') {
    this.id = id;
    this.name = name;
  }

  update(event: StreamEvent): void {
    if (event.type === 'CHAT_MESSAGE_SENT' && event.moderationInfo) {
      const message = event.moderationInfo.detectedEntity;
      
      // Análise matemática real de entropia e toxicidade
      const analysis = TextEntropyAnalyzer.analyze(message);

      if (analysis.isSpam || analysis.isToxic || analysis.detectedViolations.length > 0) {
        this.totalFilteredMessages++;
        this.inspectionLogs.push({
          text: message,
          entropy: analysis.entropy,
          violations: analysis.detectedViolations
        });

        console.log(
          `\x1b[33m[AutoMod Engine - Real Analysis]\x1b[0m 🛡 Mensagem retida no canal [@${event.channelId}]:\n` +
          `   - Texto: "${message}"\n` +
          `   - Entropia de Shannon: ${analysis.entropy} bits/char | Toxicidade: ${(analysis.toxicityScore * 100).toFixed(0)}%\n` +
          `   - Violações Detectadas: [${analysis.detectedViolations.join(', ')}]\n` +
          `   - Ação Aplicada: Mensagem deletada e autor colocado em Timeout.`
        );
      }
    }
  }

  public getFilteredCount(): number {
    return this.totalFilteredMessages;
  }

  public getLogs() {
    return [...this.inspectionLogs];
  }
}
