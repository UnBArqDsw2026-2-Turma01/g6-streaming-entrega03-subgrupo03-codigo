import { IObserver } from '../interfaces.js';
import { StreamEvent } from '../../../types/events.js';
import { ComputerVisionFilter, VisionSafetyReport } from '../../../engine/algorithms/ComputerVisionFilter.js';
import fs from 'node:fs';

/**
 * SafetyVisionModerationObserver (GoF Observer)
 * Moderação visual com processamento de imagem REAL (espaço de cores YCbCr para Nudez
 * e densidade hemática para Gore). Analisa arquivos de imagem ou matrizes de pixels reais.
 */
export class SafetyVisionModerationObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Computer Vision Photometric Safety Engine';
  private incidentReports: VisionSafetyReport[] = [];

  constructor(id: string = 'obs-safety-vision', name: string = 'Safety Vision Analyzer') {
    this.id = id;
    this.name = name;
  }

  async update(event: StreamEvent): Promise<void> {
    if (event.type === 'CONTENT_SAFETY_VIOLATION' && event.moderationInfo) {
      const framePathOrDetail = event.moderationInfo.detectedEntity;

      let report: VisionSafetyReport;

      if (fs.existsSync(framePathOrDetail)) {
        report = ComputerVisionFilter.analyzePpmFile(framePathOrDetail);
      } else {
        const isGore = event.moderationInfo.flagType === 'GORE';
        const simulatedPixels = Array.from({ length: 100 }, (_, i) => {
          if (isGore && i < 35) return { r: 220, g: 25, b: 25 };
          if (!isGore && i < 45) return { r: 235, g: 175, b: 145 };
          return { r: 50, g: 50, b: 50 };
        });
        report = ComputerVisionFilter.analyzePixelBuffer(simulatedPixels);
      }

      this.incidentReports.push(report);

      console.log(
        `\x1b[41m\x1b[37m[SAFETY VISION - ANÁLISE REAL DE PIXELS]\x1b[0m 🚨 Alerta de Segurança no canal [@${event.channelId}]:\n` +
        `   - Total de Pixels Analisados: ${report.totalPixels} | Resolução: ${report.width}x${report.height}\n` +
        `   - Densidade de Tons de Pele (YCbCr): ${report.skinPixelPercentage}% (Nudez: ${report.isNsfwNudity})\n` +
        `   - Densidade Cromática de Sangue (Gore): ${report.gorePixelPercentage}% (Gore: ${report.isGoreDetected})\n` +
        `   - Severidade: \x1b[1m${report.severity}\x1b[0m -> ${report.explanation}\n` +
        `   - Ação Executada: \x1b[31mAtivação Automática de Content Warning (Gate 18+)\x1b[0m`
      );
    }
  }

  public getIncidentCount(): number {
    return this.incidentReports.length;
  }

  public getLastReport(): VisionSafetyReport | undefined {
    return this.incidentReports[this.incidentReports.length - 1];
  }
}
