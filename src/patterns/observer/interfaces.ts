export { 
  StreamEvent, 
  NotificationReport, 
  NotificationResult, 
  StreamMetadata, 
  StreamStatus,
  StreamingPlatform,
  ModerationPayload,
  ModerationSeverity,
  StreamEventType
} from '../../types/events.js';

import { StreamEvent, NotificationReport, StreamMetadata, StreamStatus } from '../../types/events.js';

export interface SubjectState {
  status: StreamStatus;
  metadata: StreamMetadata;
  activeObserversCount: number;
}

/**
 * Interface Observer (GoF / Profa. Milene Serrano - Slide 53)
 * "Interface que padroniza os objetos interessados no estado dos Subjects"
 */
export interface IObserver {
  readonly id: string;
  readonly name: string;
  readonly targetSystem: string;

  /**
   * Método de callback chamado pelo Subject quando ocorre um evento.
   * Suporta retorno síncrono ou assíncrono (Promise).
   */
  update(event: StreamEvent): Promise<void> | void;
}

/**
 * Interface Subject (GoF / Profa. Milene Serrano - Slide 53)
 * "Interface que padroniza os objetos que serão observados"
 * Operações clássicas: attach, detach, getState e notify.
 */
export interface ISubject {
  attach(observer: IObserver): void;
  detach(observerId: string): boolean;
  getState(): SubjectState;
  notify(event: StreamEvent): Promise<NotificationReport>;
}
