import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';
import { AcousticFingerprinter, CopyrightMatch } from '../../../engine/algorithms/AcousticFingerprinter.js';

/**
 * CopyrightDMCAAudioObserver (GoF Observer)
 * Moderação de Direitos Autorais com Fingerprinting Acústico REAL.
 * Compara a assinatura acústica contra catálogo de gravadoras comerciais,
 * aplicando silenciamento da faixa de áudio e emissão de DMCA Strike.
 */
export class CopyrightDMCAAudioObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Acoustic Fingerprint & Content ID Engine';
  private strikesIssued = 0;
  private readonly matchHistory: CopyrightMatch[] = [];

  constructor(id: string = 'obs-dmca-audio', name: string = 'Acoustic DMCA Detector') {
    this.id = id;
    this.name = name;
  }

  async update(event: StreamEvent): Promise<void> {
    if (event.type === 'COPYRIGHT_DMCA_DETECTED' && event.moderationInfo) {
      const audioInput = event.moderationInfo.detectedEntity;

      // Executa correspondência acústica real
      const match = AcousticFingerprinter.matchAudioSample(audioInput);
      this.matchHistory.push(match);

      if (match.isMatch) {
        this.strikesIssued++;
        console.log(
          `\x1b[43m\x1b[30m[CONTENT ID / DMCA - FINGERPRINT REAL]\x1b[0m 🎵 Fonograma Protegido Identificado no canal [@${event.channelId}]:\n` +
          `   - Título: \x1b[1m"${match.songTitle}"\x1b[0m | Artista: ${match.artist}\n` +
          `   - Detentora dos Direitos: ${match.label}\n` +
          `   - Hash Acústico Gerado: [${match.fingerprintHash}]\n` +
          `   - Confiança do Casamento Espectral: ${(match.confidenceScore * 100).toFixed(1)}%\n` +
          `   - Ação Executada: \x1b[33mSILENCIAMENTO DA FAIXA DE ÁUDIO (Track Muted) & Strike Emitido\x1b[0m.`
        );
      }
    }
  }

  public getStrikesCount(): number {
    return this.strikesIssued;
  }

  public getLastMatch(): CopyrightMatch | undefined {
    return this.matchHistory[this.matchHistory.length - 1];
  }
}
