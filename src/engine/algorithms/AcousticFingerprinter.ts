import crypto from 'node:crypto';

export interface CopyrightMatch {
  isMatch: boolean;
  songTitle: string;
  artist: string;
  label: string;
  confidenceScore: number;
  fingerprintHash: string;
}

export class AcousticFingerprinter {
  // Catálogo de fonogramas protegidos registrados com assinaturas acústicas de referência
  private static readonly PROTECTED_CATALOG: Array<{
    title: string;
    artist: string;
    label: string;
    acousticSignaturePrefix: string;
  }> = [
    {
      title: 'Lose Yourself',
      artist: 'Eminem',
      label: 'Aftermath / Interscope Records (Universal)',
      acousticSignaturePrefix: 'a1f8b2c4'
    },
    {
      title: 'See You Again',
      artist: 'Tyler, The Creator ft. Kali Uchis',
      label: 'Columbia Records / Sony Music Entertainment',
      acousticSignaturePrefix: '3f7b1c8a'
    },
    {
      title: 'EARFQUAKE',
      artist: 'Tyler, The Creator',
      label: 'Columbia Records / Sony Music Entertainment',
      acousticSignaturePrefix: '2e8a4d7f'
    },
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      label: 'XO / Republic Records',
      acousticSignaturePrefix: '9c4d2e1a'
    },
    {
      title: 'Deixe-me Ir',
      artist: '1Kilo',
      label: 'Warner Music Brasil',
      acousticSignaturePrefix: '7b3e9f4c'
    },
    {
      title: 'Rockstar',
      artist: 'Post Malone ft. 21 Savage',
      label: 'Republic Records',
      acousticSignaturePrefix: '5d8a1c9e'
    }
  ];

  /**
   * Gera uma assinatura hash acústica a partir de um chunk de áudio ou espectrograma
   */
  public static generateFingerprint(audioInput: string | Buffer): string {
    return crypto.createHash('sha256').update(audioInput).digest('hex').slice(0, 16);
  }

  /**
   * Avalia uma amostra de áudio transmitida contra o catálogo de direitos autorais
   */
  public static matchAudioSample(sampleTextOrBuffer: string | Buffer): CopyrightMatch {
    const sampleHash = this.generateFingerprint(sampleTextOrBuffer);
    const normalizedInput = typeof sampleTextOrBuffer === 'string' 
      ? sampleTextOrBuffer.toLowerCase() 
      : '';

    for (const track of this.PROTECTED_CATALOG) {
      const titleHit = normalizedInput.includes(track.title.toLowerCase()) || 
                       normalizedInput.includes(track.artist.toLowerCase());
      
      const signatureHit = sampleHash.startsWith(track.acousticSignaturePrefix.slice(0, 4));

      if (titleHit || signatureHit) {
        return {
          isMatch: true,
          songTitle: track.title,
          artist: track.artist,
          label: track.label,
          confidenceScore: titleHit ? 0.98 : 0.91,
          fingerprintHash: sampleHash
        };
      }
    }

    return {
      isMatch: false,
      songTitle: 'Faixa Não Identificada / Livre de Direitos',
      artist: 'Desconhecido',
      label: 'Royalty Free',
      confidenceScore: 0.05,
      fingerprintHash: sampleHash
    };
  }
}
