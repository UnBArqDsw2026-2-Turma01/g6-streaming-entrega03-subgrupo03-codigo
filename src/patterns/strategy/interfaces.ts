import { StreamEvent, NotificationReport } from '../observer/interfaces.js';

export interface DispatchTelemetry {
  strategyName: string;
  totalObservers: number;
  successful: number;
  failed: number;
  dispatchDurationMs: number;
  totalDeliveryDurationMs: number;
}

/**
 * Interface Strategy (GoF / Profa. Milene Serrano - Slides 11, 12 e 13)
 * "Interface para padronizar as diferentes estratégias de um algoritmo."
 * Permite de maneira simples a variação dos algoritmos de envio/despacho
 * das notificações aos espectadores da Twitch.
 */
export interface INotificationDispatchStrategy {
  readonly strategyName: string;
  dispatch(observers: any[], event: StreamEvent): Promise<NotificationReport>;
}
