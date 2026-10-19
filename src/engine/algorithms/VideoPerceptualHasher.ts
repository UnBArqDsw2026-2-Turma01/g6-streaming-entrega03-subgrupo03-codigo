export interface PerceptualHashResult {
  hash64: string;
  isPiracyRestreamMatch: boolean;
  matchedBroadcastTitle?: string;
  hammingDistance: number;
  confidenceScore: number;
}

export class VideoPerceptualHasher {
  // Catálogo de assinaturas dHash (64-bit hexadecimal) de eventos esportivos e pay-per-view protegidos
  private static readonly PROTECTED_BROADCASTS: Array<{
    title: string;
    owner: string;
    referenceHash64: string;
  }> = [
    {
      title: 'UFC 300: Championship Main Card [PPV]',
      owner: 'UFC / TKO Group Holdings',
      referenceHash64: 'ff808080808080ff'
    },
    {
      title: "Disney's The Lion King (Theatrical Motion Picture)",
      owner: 'The Walt Disney Studios / Disney Platform Distribution',
      referenceHash64: 'eecc88000088ccee'
    },
    {
      title: "Disney's Frozen II (Official Master Stream)",
      owner: 'Walt Disney Animation Studios',
      referenceHash64: '003377ffffee7733'
    },
    {
      title: 'Marvel Studios: Avengers Endgame (Disney+ / Theatrical)',
      owner: 'Marvel Studios / The Walt Disney Company',
      referenceHash64: '1234567887654321'
    },
    {
      title: 'UEFA Champions League Final - Feed Oficial',
      owner: 'UEFA / Warner Bros Discovery',
      referenceHash64: 'f0f0e0e0c0c08080'
    },
    {
      title: 'Anime Simulcast Oficial - Crunchyroll',
      owner: 'Crunchyroll / Sony Pictures',
      referenceHash64: 'aaaa5555aaaa5555'
    }
  ];

  /**
   * Converte uma matriz de luminância de frame 8x9 para um hash de diferença (dHash) de 64 bits.
   * Algoritmo padrão da indústria para identificação perceptual de retransmissões de vídeo pirata.
   */
  public static computeDHashFromGrayscaleMatrix(matrix8x9: number[][]): string {
    if (matrix8x9.length !== 8) {
      throw new Error(`Matriz inválida: esperado 8 linhas, recebido ${matrix8x9.length}`);
    }

    let binaryString = '';
    for (let row = 0; row < 8; row++) {
      const cols = matrix8x9[row];
      for (let col = 0; col < 8; col++) {
        // Se o pixel atual for mais brilhante que o pixel à direita, bit 1, senão 0
        binaryString += cols[col] > cols[col + 1] ? '1' : '0';
      }
    }

    // Converte a sequência de 64 bits em representação hexadecimal de 16 caracteres
    let hexString = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = binaryString.slice(i, i + 4);
      hexString += parseInt(nibble, 2).toString(16);
    }

    return hexString;
  }

  /**
   * Calcula a Distância de Hamming entre dois hashes hexadecimais de 64 bits.
   * Representa o número de bits diferentes entre as duas imagens.
   */
  public static calculateHammingDistance(hexA: string, hexB: string): number {
    let distance = 0;
    const binA = hexA.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    const binB = hexB.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');

    for (let i = 0; i < 64; i++) {
      if (binA[i] !== binB[i]) {
        distance++;
      }
    }

    return distance;
  }

  /**
   * Avalia um hash perceptual de frame de vídeo contra o catálogo de eventos protegidos
   */
  public static matchFrame(frameHash64: string): PerceptualHashResult {
    let bestMatch: { title: string; owner: string; distance: number } | null = null;
    let minDistance = 64;

    for (const broadcast of this.PROTECTED_BROADCASTS) {
      const dist = this.calculateHammingDistance(frameHash64, broadcast.referenceHash64);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = { title: broadcast.title, owner: broadcast.owner, distance: dist };
      }
    }

    // Na indústria, uma distância de Hamming <= 10 em 64 bits indica quase certeza de retransmissão
    const isPiracyMatch = minDistance <= 10;
    const confidenceScore = Number((1.0 - (minDistance / 64)).toFixed(3));

    return {
      hash64: frameHash64,
      isPiracyRestreamMatch: isPiracyMatch,
      matchedBroadcastTitle: isPiracyMatch ? bestMatch?.title : undefined,
      hammingDistance: minDistance,
      confidenceScore
    };
  }
}
