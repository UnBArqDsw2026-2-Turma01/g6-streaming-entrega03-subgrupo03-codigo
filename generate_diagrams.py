import base64
import urllib.request
import os
import json

DIAGRAMS = {
    "diagrama_classes_gof": """classDiagram
    direction TB

    class ISubject {
        <<interface>>
        +attach(observer: IObserver) void
        +detach(observerId: string) boolean
        +getState() SubjectState
        +notify(event: StreamEvent) Promise~NotificationReport~
    }

    class IObserver {
        <<interface>>
        +id: string
        +name: string
        +targetSystem: string
        +update(event: StreamEvent) Promise~void~ | void
    }

    class INotificationDispatchStrategy {
        <<interface>>
        +strategyName: string
        +dispatch(observers: IObserver[], event: StreamEvent) Promise~NotificationReport~
    }

    class StreamChannel {
        -channelId: string
        -streamerName: string
        -platform: StreamingPlatform
        -status: StreamStatus
        -currentMetadata: StreamMetadata
        -observers: Map~string, IObserver~
        -dispatchStrategy: INotificationDispatchStrategy
        +getState() SubjectState
        +getStatus() StreamStatus
        +getMetadata() Readonly~StreamMetadata~
        +getObserversCount() number
        +setDispatchStrategy(strategy: INotificationDispatchStrategy) void
        +attach(observer: IObserver) void
        +detach(observerId: string) boolean
        +goLive(title, category, tags, viewerCount) Promise~NotificationReport~
        +updateMetadata(category, title) Promise~NotificationReport~
        +processChatMessage(sender, message) Promise~NotificationReport~
        +flagContentSafetyViolation(flagType, confidence, frameDetail, severity) Promise~NotificationReport~
        +flagCopyrightDMCA(songOrVideoTitle, confidence) Promise~NotificationReport~
        +flagVideoPiracyViolation(frameDHash64, confidence) Promise~NotificationReport~
        +executeModeratorAction(moderatorId, actionDescription) Promise~NotificationReport~
        +endLive() Promise~NotificationReport~
        +notify(event: StreamEvent) Promise~NotificationReport~
    }

    class AutoModObserver {
        +targetSystem: string
        -totalFilteredMessages: number
        +update(event: StreamEvent) void
        +getFilteredCount() number
    }

    class SafetyVisionModerationObserver {
        +targetSystem: string
        -incidentReports: Array
        +update(event: StreamEvent) Promise~void~
        +getIncidentCount() number
    }

    class CopyrightDMCAAudioObserver {
        +targetSystem: string
        -strikesIssued: number
        +update(event: StreamEvent) Promise~void~
        +getStrikesCount() number
    }

    class ChatRaidShieldObserver {
        +targetSystem: string
        -isShieldModeActive: boolean
        +update(event: StreamEvent) void
        +getShieldModeStatus() boolean
    }

    class PiracyVideoRestreamObserver {
        +targetSystem: string
        -piratedStreamsDetected: number
        +update(event: StreamEvent) void
        +getPiracyCount() number
    }

    class HumanModeratorDashboardObserver {
        +targetSystem: string
        -moderatorHandle: string
        -actionsExecuted: string[]
        +update(event: StreamEvent) void
        +getActionsHistory() string[]
    }

    class SynchronousBlockingDispatchStrategy {
        +strategyName: string
        +dispatch(observers, event) Promise~NotificationReport~
    }

    class AsynchronousConcurrentDispatchStrategy {
        +strategyName: string
        -concurrencyLimit: number
        +dispatch(observers, event) Promise~NotificationReport~
    }

    ISubject <|.. StreamChannel : implements (ConcreteSubject)
    StreamChannel "1" o-- "1" INotificationDispatchStrategy : delegates dispatch (Context)
    StreamChannel "1" o-- "*" IObserver : notifies (Subject)

    INotificationDispatchStrategy <|.. SynchronousBlockingDispatchStrategy : implements
    INotificationDispatchStrategy <|.. AsynchronousConcurrentDispatchStrategy : implements

    IObserver <|.. AutoModObserver : implements
    IObserver <|.. SafetyVisionModerationObserver : implements
    IObserver <|.. CopyrightDMCAAudioObserver : implements
    IObserver <|.. ChatRaidShieldObserver : implements
    IObserver <|.. PiracyVideoRestreamObserver : implements
    IObserver <|.. HumanModeratorDashboardObserver : implements
""",

    "diagrama_sequencia_gof": """sequenceDiagram
    autonumber
    actor Streamer as Streamer (Dima / eskimozin)
    actor Viewer as Espectador / Botnet
    participant Channel as StreamChannel (Subject/Context)
    participant Strategy as DispatchStrategy (Worker Pool)
    participant AutoMod as AutoModObserver
    participant VisionAI as SafetyVisionModerationObserver
    participant DMCA as CopyrightDMCAAudioObserver
    participant RaidShield as ChatRaidShieldObserver
    participant ModView as HumanModeratorDashboardObserver
    actor ModHumano as Moderador Humano (ModView)

    Streamer->>Channel: goLive("CS2 / IRL Live", "Gaming")
    activate Channel
    Channel->>Strategy: dispatch(observers, STREAM_STARTED)
    activate Strategy
    Strategy-->>Channel: Confirmação de broadcast
    deactivate Strategy
    Channel-->>Streamer: Transmissão no status LIVE
    deactivate Channel

    Viewer->>Channel: processChatMessage("bot_raid", "SPAM RAID ATTACK")
    activate Channel
    Channel->>Strategy: dispatch(observers, CHAT_MESSAGE_SENT)
    activate Strategy
    Strategy->>AutoMod: update(event) [Shannon Entropy Filter]
    Strategy->>RaidShield: update(event) [Sliding Window Velocity + Levenshtein]
    Note over RaidShield: Velocidade > 8 msg/s detectada<br/>Ativação do Shield Mode
    Strategy-->>Channel: Mensagens retidas e Chat protegido
    deactivate Strategy
    deactivate Channel

    Streamer->>Channel: flagCopyrightDMCA("Eminem - Lose Yourself", 0.98)
    activate Channel
    Note over Channel: status = AUDIO_MUTED_COPYRIGHT<br/>Incrementa strike
    Channel->>Strategy: dispatch(observers, COPYRIGHT_DMCA_DETECTED)
    activate Strategy
    Strategy->>DMCA: update(event) [Acoustic Fingerprint Match]
    Note over DMCA: Mute na faixa de áudio & Strike emitido
    Strategy->>ModView: update(event) [Alerta de Incidente]
    Strategy-->>Channel: Áudio silenciado
    deactivate Strategy
    deactivate Channel

    Streamer->>Channel: flagContentSafetyViolation("GORE", 0.96, "skin/blood ppm", "CRITICAL")
    activate Channel
    Note over Channel: status = CONTENT_WARNING_RESTRICTED<br/>hasContentWarning = true
    Channel->>Strategy: dispatch(observers, CONTENT_SAFETY_VIOLATION)
    activate Strategy
    Strategy->>VisionAI: update(event) [YCbCr & Blood Chrominance Parser]
    Note over VisionAI: Aplicação de Gate 18+ Obrigatório
    Strategy->>ModView: update(event) [Notificação Prioritária]
    Strategy-->>Channel: Gate 18+ Ativado
    deactivate Strategy
    deactivate Channel

    ModHumano->>Channel: executeModeratorAction("guardian_mod", "BAN_PERMANENTE bot_raid")
    activate Channel
    Channel->>Strategy: dispatch(observers, MODERATOR_ACTION_TAKEN)
    activate Strategy
    Strategy->>ModView: update(event) [Auditoria confirmada]
    Strategy-->>Channel: Punição efetivada
    deactivate Strategy
    deactivate Channel
""",

    "diagrama_estados_gof": """stateDiagram-v2
    [*] --> OFFLINE: Inicialização do Canal

    OFFLINE --> LIVE: goLive() [Normal]

    state LIVE {
        [*] --> TRANSMITTING_NORMAL
        TRANSMITTING_NORMAL --> CHAT_FILTERED: AutoMod retém spam/toxicidade
        CHAT_FILTERED --> TRANSMITTING_NORMAL: Retorno ao fluxo normal
        TRANSMITTING_NORMAL --> SHIELD_MODE_ACTIVE: RaidShield detecta ataque de bots
        SHIELD_MODE_ACTIVE --> TRANSMITTING_NORMAL: Fim do ataque
    }

    LIVE --> CONTENT_WARNING_RESTRICTED: flagContentSafetyViolation(GORE/NSFW) [Gate 18+]
    LIVE --> AUDIO_MUTED_COPYRIGHT: flagCopyrightDMCA() [Audio Track Muted]
    LIVE --> TERMINATED_SAFETY_VIOLATION: Violação terminal / Pirataria de Vídeo

    CONTENT_WARNING_RESTRICTED --> LIVE: Moderador aprova apelação
    AUDIO_MUTED_COPYRIGHT --> LIVE: Streamer remove áudio protegido

    CONTENT_WARNING_RESTRICTED --> ENDED: endLive()
    AUDIO_MUTED_COPYRIGHT --> ENDED: endLive()
    LIVE --> ENDED: endLive()
    TERMINATED_SAFETY_VIOLATION --> ENDED: Encerramento compulsório

    ENDED --> OFFLINE: Reset de ciclo
"""
}

out_dir = "docs/diagramas"
os.makedirs(out_dir, exist_ok=True)
artifact_dir = "/home/eduardolm/.gemini/antigravity-acp/brain/d244d805-88f0-4b68-8db5-3bf32ad63de4"

headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}

for name, code in DIAGRAMS.items():
    print(f"Gerando {name}...")
    b64 = base64.b64encode(code.encode("utf-8")).decode("ascii")
    
    # SVG
    url_svg = f"https://mermaid.ink/svg/{b64}"
    req_svg = urllib.request.Request(url_svg, headers=headers)
    with urllib.request.urlopen(req_svg) as resp:
        svg_bytes = resp.read()
        svg_path = os.path.join(out_dir, f"{name}.svg")
        with open(svg_path, "wb") as f:
            f.write(svg_bytes)
        print(f"  -> Salvo SVG: {svg_path} ({len(svg_bytes)} bytes)")
    
    # PNG
    url_png = f"https://mermaid.ink/img/{b64}"
    req_png = urllib.request.Request(url_png, headers=headers)
    with urllib.request.urlopen(req_png) as resp:
        png_bytes = resp.read()
        png_path = os.path.join(out_dir, f"{name}.png")
        with open(png_path, "wb") as f:
            f.write(png_bytes)
        print(f"  -> Salvo PNG: {png_path} ({len(png_bytes)} bytes)")
        
        # Copiar para artifacts
        artifact_png = os.path.join(artifact_dir, f"{name}.png")
        with open(artifact_png, "wb") as f:
            f.write(png_bytes)
        print(f"  -> Copiado para Artifacts: {artifact_png}")

print("TODOS OS DIAGRAMAS EM PNG E SVG GERADOS COM SUCESSO!")
