import { INotificationDispatchStrategy } from './interfaces.js';
import { IObserver, StreamEvent, NotificationReport, NotificationResult } from '../observer/interfaces.js';

/**
 * ConcreteStrategy B (GoF / Profa. Milene Serrano - Slides 12, 13 e 14)
 * Implementação da estratégia otimizada: concorrência assíncrona não-bloqueante
 * via particionamento em lotes (Worker Pool / Chunking) e tolerância a falhas.
 * Atende diretamente ao requisito de Iniciativa Extra da SubEquipe 03.
 */
export class AsynchronousConcurrentDispatchStrategy implements INotificationDispatchStrategy {
  public readonly strategyName = 'Assíncrono Concorrente (Iniciativa Extra - Worker Pool)';
  private readonly concurrencyLimit: number;

  constructor(concurrencyLimit = 150) {
    this.concurrencyLimit = concurrencyLimit;
  }

  async dispatch(observers: IObserver[], event: StreamEvent): Promise<NotificationReport> {
    const startOverall = performance.now();
    const results: NotificationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < observers.length; i += this.concurrencyLimit) {
      const chunk = observers.slice(i, i + this.concurrencyLimit);
      
      const chunkPromises = chunk.map(async (observer): Promise<NotificationResult> => {
        const obsStart = performance.now();
        try {
          await observer.update(event);
          return {
            observerId: observer.id,
            observerName: observer.name,
            targetSystem: observer.targetSystem,
            success: true,
            durationMs: performance.now() - obsStart
          };
        } catch (err) {
          return {
            observerId: observer.id,
            observerName: observer.name,
            targetSystem: observer.targetSystem,
            success: false,
            durationMs: performance.now() - obsStart,
            error: err instanceof Error ? err.message : String(err)
          };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);

      for (const res of chunkResults) {
        if (res.status === 'fulfilled') {
          if (res.value.success) successful++;
          else failed++;
          results.push(res.value);
        } else {
          failed++;
        }
      }
    }

    const totalDuration = performance.now() - startOverall;

    return {
      eventType: event.type,
      platform: event.platform,
      totalObservers: observers.length,
      successful,
      failed,
      dispatchDurationMs: totalDuration / Math.max(1, (observers.length / this.concurrencyLimit)),
      totalDeliveryDurationMs: totalDuration,
      mode: 'ASYNCHRONOUS_CONCURRENT',
      results
    };
  }
}
