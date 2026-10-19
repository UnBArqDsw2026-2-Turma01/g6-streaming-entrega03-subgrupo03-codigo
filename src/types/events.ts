export type StreamingPlatform = 'TWITCH' | 'YOUTUBE_LIVE' | 'KICK';

export type StreamStatus = 
  | 'OFFLINE' 
  | 'STARTING' 
  | 'LIVE' 
  | 'CONTENT_WARNING_RESTRICTED' 
  | 'AUDIO_MUTED_COPYRIGHT' 
  | 'TERMINATED_SAFETY_VIOLATION' 
  | 'ENDED';

export type ModerationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'TERMINAL';

export type StreamEventType = 
  | 'STREAM_STARTED' 
  | 'STREAM_METADATA_UPDATED' 
  | 'CHAT_MESSAGE_SENT'
  | 'AUTOMOD_FLAGGED'
  | 'CONTENT_SAFETY_VIOLATION' // Gore, Nudez, NSFW
  | 'COPYRIGHT_DMCA_DETECTED'  // Músicas ou mídias protegidas por direitos autorais
  | 'MODERATOR_ACTION_TAKEN'   // Ban, timeout, aviso emitido por moderador humano
  | 'STREAM_ENDED';

export interface StreamMetadata {
  channelId: string;
  streamerName: string;
  platform: StreamingPlatform;
  title: string;
  category: string;
  tags: string[];
  viewerCount: number;
  streamUrl: string;
  hasContentWarning?: boolean;
  isAudioMuted?: boolean;
  strikeCount: number;
  startedAt?: Date;
  endedAt?: Date;
}

export interface ModerationPayload {
  channelId: string;
  platform: StreamingPlatform;
  severity: ModerationSeverity;
  flagType: 'TEXT_TOXICITY' | 'SPAM' | 'GORE' | 'NUDITY_NSFW' | 'COPYRIGHT_AUDIO' | 'COPYRIGHT_VIDEO' | 'CHAT_RAID_BURST';
  detectedEntity: string; // Mensagem, hash do áudio, confiança da IA, etc.
  confidenceScore: number; // 0.0 a 1.0
  actionApplied: string;
  moderatorId?: string; // ID do moderador se foi humano, ou 'AUTOMOD_AI'
  timestamp: Date;
}

export interface StreamEvent {
  type: StreamEventType;
  platform: StreamingPlatform;
  channelId: string;
  timestamp: Date;
  payload: StreamMetadata;
  moderationInfo?: ModerationPayload;
}

export interface NotificationResult {
  observerId: string;
  observerName: string;
  targetSystem: string;
  success: boolean;
  durationMs: number;
  error?: string;
  actionLogged?: string;
}

export interface NotificationReport {
  eventType: StreamEventType;
  platform: StreamingPlatform;
  totalObservers: number;
  successful: number;
  failed: number;
  dispatchDurationMs: number;
  totalDeliveryDurationMs: number;
  mode: 'SYNCHRONOUS_BLOCKING' | 'ASYNCHRONOUS_CONCURRENT';
  results?: NotificationResult[];
}
