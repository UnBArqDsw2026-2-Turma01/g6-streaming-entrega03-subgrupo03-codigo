export interface ChatMessageRecord {
  sender: string;
  message: string;
  timestamp: number;
}

export interface RaidDetectionResult {
  isRaidDetected: boolean;
  velocityMsgPerSec: number;
  duplicateClusterRatio: number;
  burstSeverity: 'NORMAL' | 'ELEVATED' | 'RAID_ATTACK';
  actionRecommended: 'NO_ACTION' | 'ENABLE_SLOW_MODE' | 'ENABLE_SHIELD_MODE_SUB_ONLY';
  details: string;
}

export class ChatRaidVelocityFilter {
  /**
   * Calcula a distância de Levenshtein entre duas strings
   * para medir similaridade entre mensagens de bots em ataques coordenados.
   */
  public static calculateLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    const lenA = a.length;
    const lenB = b.length;

    for (let i = 0; i <= lenA; i++) matrix[i] = [i];
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deleção
          matrix[i][j - 1] + 1,      // inserção
          matrix[i - 1][j - 1] + cost // substituição
        );
      }
    }

    return matrix[lenA][lenB];
  }

  /**
   * Similaridade normalizada entre 0.0 (totalmente diferente) e 1.0 (idêntico)
   */
  public static calculateSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    const dist = this.calculateLevenshteinDistance(a, b);
    return 1.0 - dist / maxLen;
  }

  /**
   * Algoritmo de Janela Deslizante (Sliding Window Velocity Analyzer)
   * Analisa mensagens nos últimos N segundos (ex: 5s) e avalia taxa de explosão (burst rate)
   * e porcentagem de mensagens quase idênticas (ataque coordenado / raid de bots).
   */
  public static analyzeWindow(
    messages: ChatMessageRecord[],
    windowMs: number = 5000,
    velocityThresholdMsgSec: number = 8.0,
    similarityClusterThreshold: number = 0.65
  ): RaidDetectionResult {
    const now = Date.now();
    const windowStart = now - windowMs;
    const windowMessages = messages.filter(m => m.timestamp >= windowStart);

    const count = windowMessages.length;
    const windowSec = windowMs / 1000;
    const velocity = Number((count / windowSec).toFixed(2));

    if (count < 5) {
      return {
        isRaidDetected: false,
        velocityMsgPerSec: velocity,
        duplicateClusterRatio: 0,
        burstSeverity: 'NORMAL',
        actionRecommended: 'NO_ACTION',
        details: 'Fluxo de chat dentro da velocidade padrão.'
      };
    }

    // Calcula pares similares via Levenshtein
    let similarPairs = 0;
    let totalPairs = 0;

    for (let i = 0; i < windowMessages.length; i++) {
      for (let j = i + 1; j < windowMessages.length; j++) {
        totalPairs++;
        const sim = this.calculateSimilarity(windowMessages[i].message, windowMessages[j].message);
        if (sim >= similarityClusterThreshold) {
          similarPairs++;
        }
      }
    }

    const clusterRatio = totalPairs > 0 ? Number((similarPairs / totalPairs).toFixed(2)) : 0;
    const isVelocityHigh = velocity >= velocityThresholdMsgSec || count >= 8;
    const isClusterHigh = clusterRatio >= 0.40;

    let burstSeverity: 'NORMAL' | 'ELEVATED' | 'RAID_ATTACK' = 'NORMAL';
    let actionRecommended: 'NO_ACTION' | 'ENABLE_SLOW_MODE' | 'ENABLE_SHIELD_MODE_SUB_ONLY' = 'NO_ACTION';
    let details = 'Chat operando normalmente.';

    if (isVelocityHigh && isClusterHigh) {
      burstSeverity = 'RAID_ATTACK';
      actionRecommended = 'ENABLE_SHIELD_MODE_SUB_ONLY';
      details = `Ataque de Raid/Botnet detectado! Velocidade: ${velocity} msg/s | Similaridade de cluster: ${(clusterRatio * 100).toFixed(0)}%.`;
    } else if (isVelocityHigh || isClusterHigh) {
      burstSeverity = 'ELEVATED';
      actionRecommended = 'ENABLE_SLOW_MODE';
      details = `Atividade incomum no chat. Velocidade: ${velocity} msg/s | Similaridade: ${(clusterRatio * 100).toFixed(0)}%.`;
    }

    return {
      isRaidDetected: burstSeverity === 'RAID_ATTACK',
      velocityMsgPerSec: velocity,
      duplicateClusterRatio: clusterRatio,
      burstSeverity,
      actionRecommended,
      details
    };
  }
}
