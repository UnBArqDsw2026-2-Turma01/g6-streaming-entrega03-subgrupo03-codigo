import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';
import { VideoPerceptualHasher, PerceptualHashResult } from '../../../engine/algorithms/VideoPerceptualHasher.js';

/**
 * PiracyVideoRestreamObserver (GoF Observer)
 * Moderação de Transmissão de Vídeo Pirata utilizando Hashing Perceptual (dHash de 64 bits)
 * e Distância de Hamming. Detecta retransmissão ilegal de Pay-Per-View (ex: UFC, Futebol).
 */
export class PiracyVideoRestreamObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Live Video Perceptual Fingerprint & Piracy Engine';
  private piratedStreamsDetected = 0;
  private lastMatch?: PerceptualHashResult;

  constructor(id: string = 'obs-piracy-video', name: string = 'Video Piracy dHash Detector') {
    this.id = id;
    this.name = name;
  }

  update(event: StreamEvent): void {
    if (event.type === 'COPYRIGHT_DMCA_DETECTED' && event.moderationInfo?.flagType === 'COPYRIGHT_VIDEO') {
      const frameHash64 = event.moderationInfo.detectedEntity;
      const match = VideoPerceptualHasher.matchFrame(frameHash64);
      this.lastMatch = match;

      if (match.isPiracyRestreamMatch) {
        this.piratedStreamsDetected++;
        console.log(
          `\x1b[41m\x1b[37m[PIRACY DETECTOR - dHASH DE VÍDEO]\x1b[0m 🛑 Retransmissão Ilegal Detectada no canal [@${event.channelId}]:\n` +
          `   - Transmissão Oficial Correspondente: "${match.matchedBroadcastTitle}"\n` +
          `   - Distância de Hamming: ${match.hammingDistance}/64 bits (Confiança: ${(match.confidenceScore * 100).toFixed(1)}%)\n` +
          `   - Hash Perceptual: [${match.hash64}]\n` +
          `   - Ação Executada: Notificação Judicial DMCA & Derrubada Imediata do Feed de Vídeo.`
        );
      }
    }
  }

  public getPiracyCount(): number {
    return this.piratedStreamsDetected;
  }

  public getLastMatch(): PerceptualHashResult | undefined {
    return this.lastMatch;
  }
}
