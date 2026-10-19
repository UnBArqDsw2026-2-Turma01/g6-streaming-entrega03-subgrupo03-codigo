import { INotificationDispatchStrategy } from './interfaces.js';
import { IObserver, StreamEvent, NotificationReport, NotificationResult } from '../observer/interfaces.js';

/**
 * ConcreteStrategy A (GoF / Profa. Milene Serrano - Slides 12, 13 e 14)
 * Implementação da estratégia ingênua/tradicional: iteração síncrona linear.
 * Espelha a nota do Slide 53: "for each view in views: v.update()"
 */
export class SynchronousBlockingDispatchStrategy implements INotificationDispatchStrategy {
  public readonly strategyName = 'Síncrono Sequencial (GoF Clássico Linear)';

  async dispatch(observers: IObserver[], event: StreamEvent): Promise<NotificationReport> {
    const startTime = performance.now();
    const results: NotificationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const observer of observers) {
      const obsStart = performance.now();
      try {
        await observer.update(event);
        successful++;
        results.push({
          observerId: observer.id,
          observerName: observer.name,
          targetSystem: observer.targetSystem,
          success: true,
          durationMs: performance.now() - obsStart
        });
      } catch (err) {
        failed++;
        results.push({
          observerId: observer.id,
          observerName: observer.name,
          targetSystem: observer.targetSystem,
          success: false,
          durationMs: performance.now() - obsStart,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    const elapsed = performance.now() - startTime;

    return {
      eventType: event.type,
      platform: event.platform,
      totalObservers: observers.length,
      successful,
      failed,
      dispatchDurationMs: elapsed,
      totalDeliveryDurationMs: elapsed,
      mode: 'SYNCHRONOUS_BLOCKING',
      results
    };
  }
}
