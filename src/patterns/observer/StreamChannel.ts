import { 
  ISubject, 
  IObserver, 
  StreamEvent, 
  StreamStatus, 
  StreamMetadata, 
  NotificationReport, 
  SubjectState 
} from './interfaces.js';
import { StreamingPlatform, ModerationPayload, ModerationSeverity } from '../../types/events.js';
import { INotificationDispatchStrategy } from '../strategy/interfaces.js';
import { AsynchronousConcurrentDispatchStrategy } from '../strategy/AsynchronousConcurrentDispatchStrategy.js';

/**
 * ConcreteSubject (GoF Observer - Slide 53) e Context (GoF Strategy - Slide 12 e 13)
 * 
 * - Papel no Observer: Mantém a coleção de observadores (views), gerencia o ciclo
 *   de vida da live (Twitch, YouTube Live, Kick) e o pipeline reativo de Moderação
 *   (AutoMod, Detecção de Nudez/Gore, DMCA Copyright e Ações de Moderadores Humanos).
 * - Papel no Strategy: Mantém referência para a estratégia de despacho (setDispatchStrategy),
 *   permitindo alternar dinamicamente entre envio linear síncrono e concorrente assíncrono.
 */
export class StreamChannel implements ISubject {
  public readonly channelId: string;
  public readonly streamerName: string;
  public readonly platform: StreamingPlatform;
  private status: StreamStatus = 'OFFLINE';
  private currentMetadata: StreamMetadata;
  private readonly observers: Map<string, IObserver> = new Map();
  private dispatchStrategy: INotificationDispatchStrategy;

  constructor(
    channelId: string, 
    streamerName: string, 
    platform: StreamingPlatform = 'TWITCH',
    defaultCategory = 'Just Chatting',
    initialStrategy: INotificationDispatchStrategy = new AsynchronousConcurrentDispatchStrategy()
  ) {
    this.channelId = channelId;
    this.streamerName = streamerName;
    this.platform = platform;
    this.dispatchStrategy = initialStrategy;

    const baseUrls: Record<StreamingPlatform, string> = {
      TWITCH: `https://twitch.tv/${channelId}`,
      YOUTUBE_LIVE: `https://youtube.com/@${channelId}/live`,
      KICK: `https://kick.com/${channelId}`
    };

    this.currentMetadata = {
      channelId,
      streamerName,
      platform,
      title: 'Transmissão Offline',
      category: defaultCategory,
      tags: [],
      viewerCount: 0,
      streamUrl: baseUrls[platform] || `https://twitch.tv/${channelId}`,
      hasContentWarning: false,
      isAudioMuted: false,
      strikeCount: 0
    };
  }

  /**
   * Padrão Strategy: Altera dinamicamente o algoritmo de despacho de notificações
   */
  public setDispatchStrategy(strategy: INotificationDispatchStrategy): void {
    this.dispatchStrategy = strategy;
  }

  public getDispatchStrategyName(): string {
    return this.dispatchStrategy.strategyName;
  }

  /**
   * Padrão Observer: Retorna o estado atual do objeto observado (Slide 53)
   */
  public getState(): SubjectState {
    return {
      status: this.status,
      metadata: { ...this.currentMetadata },
      activeObserversCount: this.observers.size
    };
  }

  public getStatus(): StreamStatus {
    return this.status;
  }

  public getMetadata(): Readonly<StreamMetadata> {
    return { ...this.currentMetadata };
  }

  public getObserversCount(): number {
    return this.observers.size;
  }

  /**
   * Padrão Observer: Anexa um observador (attach)
   */
  public attach(observer: IObserver): void {
    if (!this.observers.has(observer.id)) {
      this.observers.set(observer.id, observer);
    }
  }

  /**
   * Padrão Observer: Desanexa um observador (detach)
   */
  public detach(observerId: string): boolean {
    return this.observers.delete(observerId);
  }

  /**
   * Inicia a transmissão ao vivo na plataforma (Twitch, YouTube ou Kick)
   */
  public async goLive(
    title: string, 
    category: string, 
    tags: string[] = ['gaming', 'live'],
    viewerCount = 1
  ): Promise<NotificationReport> {
    this.status = 'LIVE';
    this.currentMetadata = {
      ...this.currentMetadata,
      title,
      category,
      tags,
      viewerCount,
      startedAt: new Date()
    };

    const event: StreamEvent = {
      type: 'STREAM_STARTED',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata }
    };

    return this.notify(event);
  }

  /**
   * Atualiza metadados da transmissão (ex: mudança de jogo no painel da Twitch/Kick/YouTube)
   */
  public async updateMetadata(category?: string, title?: string): Promise<NotificationReport> {
    if (this.status === 'OFFLINE' || this.status === 'ENDED') {
      throw new Error('Não é possível atualizar metadados de um canal offline.');
    }

    if (category) this.currentMetadata.category = category;
    if (title) this.currentMetadata.title = title;

    const event: StreamEvent = {
      type: 'STREAM_METADATA_UPDATED',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata }
    };

    return this.notify(event);
  }

  // =========================================================================
  // SUB-SISTEMA REATIVO DE MODERAÇÃO (Observer Pattern)
  // =========================================================================

  /**
   * Processamento e Moderação de Chat (AutoMod)
   */
  public async processChatMessage(sender: string, message: string): Promise<NotificationReport> {
    const isToxic = message.toLowerCase().includes('hate') || message.toLowerCase().includes('hack') || message.toLowerCase().includes('doxx');
    const isSpam = message.length > 150 || (message.match(/http/g) || []).length > 2;
    const hasViolation = isToxic || isSpam;

    const moderationInfo: ModerationPayload = {
      channelId: this.channelId,
      platform: this.platform,
      severity: hasViolation ? 'WARNING' : 'INFO',
      flagType: isToxic ? 'TEXT_TOXICITY' : isSpam ? 'SPAM' : 'TEXT_TOXICITY',
      detectedEntity: message,
      confidenceScore: isToxic ? 0.94 : isSpam ? 0.88 : 0.01,
      actionApplied: isToxic ? 'MESSAGE_BLOCKED_TIMEOUT_60S' : isSpam ? 'MESSAGE_DELETED_SPAM_FILTER' : 'MESSAGE_ALLOWED',
      timestamp: new Date()
    };

    const event: StreamEvent = {
      type: 'CHAT_MESSAGE_SENT',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata },
      moderationInfo
    };

    return this.notify(event);
  }

  /**
   * Moderação Automática de Segurança Visual: Nudez (NSFW) e Gore
   */
  public async flagContentSafetyViolation(
    flagType: 'GORE' | 'NUDITY_NSFW', 
    confidenceScore: number, 
    frameDetail: string,
    severity: ModerationSeverity = 'CRITICAL'
  ): Promise<NotificationReport> {
    this.currentMetadata.hasContentWarning = true;
    this.currentMetadata.strikeCount += (severity === 'TERMINAL' ? 3 : 1);

    if (severity === 'TERMINAL') {
      this.status = 'TERMINATED_SAFETY_VIOLATION';
    } else {
      this.status = 'CONTENT_WARNING_RESTRICTED';
    }

    const moderationInfo: ModerationPayload = {
      channelId: this.channelId,
      platform: this.platform,
      severity,
      flagType,
      detectedEntity: frameDetail,
      confidenceScore,
      actionApplied: severity === 'TERMINAL' ? 'TERMINATE_LIVE_STREAM' : 'APPLY_18_PLUS_CONTENT_WARNING_GATE',
      timestamp: new Date()
    };

    const event: StreamEvent = {
      type: 'CONTENT_SAFETY_VIOLATION',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata },
      moderationInfo
    };

    return this.notify(event);
  }

  /**
   * Moderação Automática de Direitos Autorais / DMCA (Content ID & Audio Fingerprint)
   */
  public async flagCopyrightDMCA(
    songOrVideoTitle: string, 
    confidenceScore: number
  ): Promise<NotificationReport> {
    this.currentMetadata.isAudioMuted = true;
    this.currentMetadata.strikeCount += 1;
    this.status = 'AUDIO_MUTED_COPYRIGHT';

    const moderationInfo: ModerationPayload = {
      channelId: this.channelId,
      platform: this.platform,
      severity: 'WARNING',
      flagType: 'COPYRIGHT_AUDIO',
      detectedEntity: songOrVideoTitle,
      confidenceScore,
      actionApplied: 'MUTE_AUDIO_OUTPUT_ISSUE_COPYRIGHT_WARNING',
      timestamp: new Date()
    };

    const event: StreamEvent = {
      type: 'COPYRIGHT_DMCA_DETECTED',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata },
      moderationInfo
    };

    return this.notify(event);
  }

  /**
   * Moderação de Vídeo Pirata / Retransmissão Não Autorizada (pHash / dHash)
   */
  public async flagVideoPiracyViolation(
    frameDHash64: string,
    confidenceScore: number
  ): Promise<NotificationReport> {
    this.currentMetadata.strikeCount += 2;
    this.status = 'TERMINATED_SAFETY_VIOLATION';

    const moderationInfo: ModerationPayload = {
      channelId: this.channelId,
      platform: this.platform,
      severity: 'TERMINAL',
      flagType: 'COPYRIGHT_VIDEO',
      detectedEntity: frameDHash64,
      confidenceScore,
      actionApplied: 'TERMINATE_PIRACY_RESTREAM_TAKEDOWN',
      timestamp: new Date()
    };

    const event: StreamEvent = {
      type: 'COPYRIGHT_DMCA_DETECTED',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata },
      moderationInfo
    };

    return this.notify(event);
  }

  /**
   * Ação manual tomada por um Moderador Humano
   */
  public async executeModeratorAction(
    moderatorId: string, 
    actionDescription: string
  ): Promise<NotificationReport> {
    const moderationInfo: ModerationPayload = {
      channelId: this.channelId,
      platform: this.platform,
      severity: 'INFO',
      flagType: 'TEXT_TOXICITY',
      detectedEntity: actionDescription,
      confidenceScore: 1.0,
      actionApplied: actionDescription,
      moderatorId,
      timestamp: new Date()
    };

    const event: StreamEvent = {
      type: 'MODERATOR_ACTION_TAKEN',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata },
      moderationInfo
    };

    return this.notify(event);
  }

  /**
   * Encerra a transmissão ao vivo
   */
  public async endLive(): Promise<NotificationReport> {
    this.status = 'ENDED';
    this.currentMetadata.endedAt = new Date();

    const event: StreamEvent = {
      type: 'STREAM_ENDED',
      platform: this.platform,
      channelId: this.channelId,
      timestamp: new Date(),
      payload: { ...this.currentMetadata }
    };

    const report = await this.notify(event);
    this.status = 'OFFLINE';
    return report;
  }

  /**
   * Padrão Observer + Strategy:
   * O Subject delega a entrega dos eventos para a estratégia configurada
   * (Context delega para Strategy - Slide 12 e 26).
   */
  public async notify(event: StreamEvent): Promise<NotificationReport> {
    const observerList = Array.from(this.observers.values());
    return this.dispatchStrategy.dispatch(observerList, event);
  }
}
