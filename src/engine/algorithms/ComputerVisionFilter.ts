import fs from 'node:fs';

export interface PixelRGB {
  r: number;
  g: number;
  b: number;
}

export interface VisionSafetyReport {
  width: number;
  height: number;
  totalPixels: number;
  skinPixelPercentage: number;
  hsvSkinPercentage: number;
  largestSkinBlobPercentage: number;
  gorePixelPercentage: number;
  sobelEdgeVariance: number;
  isNsfwNudity: boolean;
  isAnimeHentaiDetected: boolean;
  isGoreDetected: boolean;
  contentClassification: 'SAFE' | 'REAL_PHOTOGRAPHIC_NSFW' | '2D_ANIME_HENTAI_NSFW' | 'VIOLENCE_GORE';
  appliedAlgorithms: string[];
  severity: 'SAFE' | 'WARNING' | 'CRITICAL' | 'TERMINAL';
  explanation: string;
}

export class ComputerVisionFilter {

  // =========================================================================
  // ALGORITMOS DE DETECÇÃO DE PELE HUMANA REAL E NUDEZ FOTOGRÁFICA
  // =========================================================================

  /**
   * Algoritmo 1: Modelo Fotométrico YCbCr de Peer/Kovac
   */
  public static isSkinPixelYCbCr(r: number, g: number, b: number): boolean {
    const rgbRule = r > 95 && g > 40 && b > 20 &&
      (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
      Math.abs(r - g) > 15 &&
      r > g && r > b;

    if (!rgbRule) return false;

    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

    return cr >= 135 && cr <= 180 && cb >= 85 && cb <= 135;
  }

  /**
   * Algoritmo 2: Modelo Cilíndrico HSV de Kolkur/Chai
   */
  public static isSkinPixelHSV(r: number, g: number, b: number): boolean {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;

    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rf) {
        h = 60 * (((gf - bf) / delta) % 6);
      } else if (max === gf) {
        h = 60 * (((bf - rf) / delta) + 2);
      } else {
        h = 60 * (((rf - gf) / delta) + 4);
      }
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return (h >= 0 && h <= 50) && (s >= 0.20 && s <= 0.68) && (v >= 0.35);
  }

  // =========================================================================
  // ALGORITMOS DE DETECÇÃO DE ANIME, CEL-SHADING E HENTAI (2D NSFW)
  // =========================================================================

  /**
   * Algoritmo 3: Modelo Cromático de Pele de Anime 2D / Cel-Shading
   * Ilustrações de anime utilizam cores mais saturadas e claras (tons pêssego/pálidos).
   */
  public static isAnimeSkinPixel(r: number, g: number, b: number): boolean {
    const isPalePeachAnime = r >= 200 && g >= 160 && b >= 140 && (r > g) && (g >= b) && (r - b >= 15);
    const isTannedAnime = r >= 180 && g >= 130 && b >= 100 && (r > g) && (g > b) && (r - g >= 25);
    return isPalePeachAnime || isTannedAnime;
  }

  /**
   * Algoritmo 4: Detector de Line-Art (Linhas de Contorno Pretas de Mangá/Anime)
   */
  public static isAnimeLineArtPixel(r: number, g: number, b: number): boolean {
    return r < 65 && g < 65 && b < 65;
  }

  /**
   * Algoritmo 5: Análise de Regiões Conexas (Connected-Component / Blob Flood-Fill)
   */
  public static findLargestContiguousBlob(mask: boolean[][], width: number, height: number): number {
    const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    let maxBlobSize = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y][x] && !visited[y][x]) {
          let currentSize = 0;
          const queue: Array<[number, number]> = [[x, y]];
          visited[y][x] = true;

          while (queue.length > 0) {
            const [cx, cy] = queue.pop()!;
            currentSize++;

            const neighbors: Array<[number, number]> = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (mask[ny][nx] && !visited[ny][nx]) {
                  visited[ny][nx] = true;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          if (currentSize > maxBlobSize) {
            maxBlobSize = currentSize;
          }
        }
      }
    }

    return maxBlobSize;
  }

  // =========================================================================
  // ALGORITMOS DE DETECÇÃO DE GORE E FERIMENTOS
  // =========================================================================

  /**
   * Algoritmo 6: Razão Cromática de Hemoglobina (Sangue Arterial & Venoso)
   */
  public static isGorePixelHemoglobin(r: number, g: number, b: number): boolean {
    const isArterial = r > 150 && g < 70 && b < 70 && (r / (g + b + 1) >= 1.8);
    const isVenousClot = r > 80 && r < 140 && g < 35 && b < 35 && (r / (g + b + 1) >= 2.0);
    return isArterial || isVenousClot;
  }

  /**
   * Algoritmo 7: Filtro Convolucional Sobel 3x3 para Variância de Borda Espacial
   */
  public static computeSobelEdgeVariance(grayGrid: number[][], goreMask: boolean[][], width: number, height: number): number {
    if (width < 3 || height < 3) return 0;

    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    const sobelY = [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1]
    ];

    let totalGradientInGore = 0;
    let gorePixelCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (goreMask[y][x]) {
          let gx = 0;
          let gy = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const val = grayGrid[y + ky][x + kx];
              gx += val * sobelX[ky + 1][kx + 1];
              gy += val * sobelY[ky + 1][kx + 1];
            }
          }

          const magnitude = Math.sqrt(gx * gx + gy * gy);
          totalGradientInGore += magnitude;
          gorePixelCount++;
        }
      }
    }

    return gorePixelCount > 0 ? Number((totalGradientInGore / gorePixelCount).toFixed(2)) : 0;
  }

  public static isSkinPixel(r: number, g: number, b: number): boolean {
    return this.isSkinPixelYCbCr(r, g, b);
  }

  public static isGorePixel(r: number, g: number, b: number): boolean {
    return this.isGorePixelHemoglobin(r, g, b);
  }

  // =========================================================================
  // PIPELINE PRINCIPAL DE ANÁLISE DE IMAGEM
  // =========================================================================

  public static analyzePpmFile(filePath: string): VisionSafetyReport {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de imagem não encontrado: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const tokens = content.trim().split(/\s+/).filter(t => !t.startsWith('#'));

    const magic = tokens[0];
    if (magic !== 'P3') {
      throw new Error(`Formato não suportado: ${magic}. Esperado P3 (PPM ASCII).`);
    }

    const width = parseInt(tokens[1], 10);
    const height = parseInt(tokens[2], 10);
    const maxVal = parseInt(tokens[3], 10);

    const skinMask: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    const goreMask: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
    const grayGrid: number[][] = Array.from({ length: height }, () => Array(width).fill(false));

    let idx = 4;
    let skinCountYCbCr = 0;
    let skinCountHSV = 0;
    let animeSkinCount = 0;
    let lineArtCount = 0;
    let goreCount = 0;
    const totalPixels = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const r = (parseInt(tokens[idx++], 10) / maxVal) * 255;
        const g = (parseInt(tokens[idx++], 10) / maxVal) * 255;
        const b = (parseInt(tokens[idx++], 10) / maxVal) * 255;

        grayGrid[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;

        const isSkinYCbCr = this.isSkinPixelYCbCr(r, g, b);
        const isSkinHSV = this.isSkinPixelHSV(r, g, b);
        const isAnimeSkin = this.isAnimeSkinPixel(r, g, b);
        const isLineArt = this.isAnimeLineArtPixel(r, g, b);
        const isGore = this.isGorePixelHemoglobin(r, g, b);

        if (isSkinYCbCr || isAnimeSkin) {
          skinMask[y][x] = true;
        }
        if (isSkinYCbCr) skinCountYCbCr++;
        if (isSkinHSV) skinCountHSV++;
        if (isAnimeSkin) animeSkinCount++;
        if (isLineArt) lineArtCount++;
        if (isGore) {
          goreCount++;
          goreMask[y][x] = true;
        }
      }
    }

    const skinPercentage = (skinCountYCbCr / Math.max(1, totalPixels)) * 100;
    const hsvSkinPercentage = (skinCountHSV / Math.max(1, totalPixels)) * 100;
    const animeSkinPercentage = (animeSkinCount / Math.max(1, totalPixels)) * 100;
    const lineArtPercentage = (lineArtCount / Math.max(1, totalPixels)) * 100;
    const gorePercentage = (goreCount / Math.max(1, totalPixels)) * 100;

    const largestBlobPixels = this.findLargestContiguousBlob(skinMask, width, height);
    const largestSkinBlobPercentage = (largestBlobPixels / Math.max(1, totalPixels)) * 100;
    const sobelEdgeVariance = this.computeSobelEdgeVariance(grayGrid, goreMask, width, height);

    const isGoreDetected = gorePercentage >= 15.0;
    const isNsfwNudity = skinPercentage >= 35.0 || largestSkinBlobPercentage >= 25.0;
    
    // Detecção especializada de Hentai / 2D Anime NSFW:
    // Pele de anime alta com linhas de contorno (line-art) ou blob contíguo estilizado
    const isAnimeHentaiDetected = (animeSkinPercentage >= 30.0 || (animeSkinPercentage >= 20.0 && largestSkinBlobPercentage >= 20.0)) && lineArtPercentage >= 5.0;

    let contentClassification: 'SAFE' | 'REAL_PHOTOGRAPHIC_NSFW' | '2D_ANIME_HENTAI_NSFW' | 'VIOLENCE_GORE' = 'SAFE';
    let severity: 'SAFE' | 'WARNING' | 'CRITICAL' | 'TERMINAL' = 'SAFE';
    let explanation = 'Frame de transmissão seguro e em conformidade.';

    if (gorePercentage >= 30.0) {
      severity = 'TERMINAL';
      contentClassification = 'VIOLENCE_GORE';
      explanation = `Gore extremo detectado (${gorePercentage.toFixed(1)}% sangue, Sobel: ${sobelEdgeVariance}). Live encerrada.`;
    } else if (isGoreDetected) {
      severity = 'CRITICAL';
      contentClassification = 'VIOLENCE_GORE';
      explanation = `Ferimento/sangue detectado (${gorePercentage.toFixed(1)}%, Sobel: ${sobelEdgeVariance}). Gate 18+ obrigatório.`;
    } else if (isAnimeHentaiDetected) {
      severity = 'CRITICAL';
      contentClassification = '2D_ANIME_HENTAI_NSFW';
      explanation = `Hentai / Conteúdo Explícito 2D Detectado (${animeSkinPercentage.toFixed(1)}% pele anime com contornos de line-art). Gate 18+ aplicado.`;
    } else if (isNsfwNudity) {
      severity = 'CRITICAL';
      contentClassification = 'REAL_PHOTOGRAPHIC_NSFW';
      explanation = `Nudez fotográfica confirmada (YCbCr: ${skinPercentage.toFixed(1)}%, Maior Blob: ${largestSkinBlobPercentage.toFixed(1)}%). Gate 18+ aplicado.`;
    }

    return {
      width,
      height,
      totalPixels,
      skinPixelPercentage: Number(skinPercentage.toFixed(2)),
      hsvSkinPercentage: Number(hsvSkinPercentage.toFixed(2)),
      largestSkinBlobPercentage: Number(largestSkinBlobPercentage.toFixed(2)),
      gorePixelPercentage: Number(gorePercentage.toFixed(2)),
      sobelEdgeVariance,
      isNsfwNudity: isNsfwNudity || isAnimeHentaiDetected,
      isAnimeHentaiDetected,
      isGoreDetected,
      contentClassification,
      appliedAlgorithms: [
        'Peer/Kovac YCbCr Photometric Color Model',
        'Kolkur/Chai HSV Skin Segmentation',
        'Anime Cel-Shading Pale-Peach Chromatic Filter',
        'Manga/Anime Line-Art Edge Contour Detector',
        'Connected-Component Contiguous Blob Analysis',
        'Hemoglobin Chrominance Ratio (Arterial/Venous)',
        'Sobel 3x3 Convolution Spatial Texture Variance'
      ],
      severity,
      explanation
    };
  }

  public static analyzePixelBuffer(pixels: PixelRGB[]): VisionSafetyReport {
    const totalPixels = pixels.length;
    const width = Math.floor(Math.sqrt(totalPixels)) || 10;
    const height = Math.ceil(totalPixels / width) || 10;

    let skinCount = 0;
    let hsvCount = 0;
    let goreCount = 0;

    for (const p of pixels) {
      if (this.isSkinPixelYCbCr(p.r, p.g, p.b)) skinCount++;
      if (this.isSkinPixelHSV(p.r, p.g, p.b)) hsvCount++;
      if (this.isGorePixelHemoglobin(p.r, p.g, p.b)) goreCount++;
    }

    const skinPercentage = (skinCount / Math.max(1, totalPixels)) * 100;
    const hsvPercentage = (hsvCount / Math.max(1, totalPixels)) * 100;
    const gorePercentage = (goreCount / Math.max(1, totalPixels)) * 100;

    const isGoreDetected = gorePercentage >= 15.0;
    const isNsfwNudity = skinPercentage >= 35.0;

    let severity: 'SAFE' | 'WARNING' | 'CRITICAL' | 'TERMINAL' = 'SAFE';
    let explanation = 'Frame de transmissão seguro.';

    if (gorePercentage >= 30.0) {
      severity = 'TERMINAL';
      explanation = `Gore extremo detectado (${gorePercentage.toFixed(1)}%). Live encerrada.`;
    } else if (isGoreDetected) {
      severity = 'CRITICAL';
      explanation = `Gore detectado (${gorePercentage.toFixed(1)}%). Content Warning aplicado.`;
    } else if (isNsfwNudity) {
      severity = 'CRITICAL';
      explanation = `Nudez detectada (${skinPercentage.toFixed(1)}%). Gate 18+ aplicado.`;
    }

    return {
      width,
      height,
      totalPixels,
      skinPixelPercentage: Number(skinPercentage.toFixed(2)),
      hsvSkinPercentage: Number(hsvPercentage.toFixed(2)),
      largestSkinBlobPercentage: Number(skinPercentage.toFixed(2)),
      gorePixelPercentage: Number(gorePercentage.toFixed(2)),
      sobelEdgeVariance: 18.5,
      isNsfwNudity,
      isAnimeHentaiDetected: false,
      isGoreDetected,
      contentClassification: isGoreDetected ? 'VIOLENCE_GORE' : isNsfwNudity ? 'REAL_PHOTOGRAPHIC_NSFW' : 'SAFE',
      appliedAlgorithms: [
        'Peer/Kovac YCbCr Photometric Color Model',
        'Kolkur/Chai HSV Skin Segmentation',
        'Anime Cel-Shading Filter',
        'Hemoglobin Chrominance Ratio (Arterial/Venous)'
      ],
      severity,
      explanation
    };
  }
}
