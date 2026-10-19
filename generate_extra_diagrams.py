import base64
import urllib.request
import os

EXTRA_DIAGRAMS = {
    "diagrama_atividades_pipeline": """flowchart TD
    Start([Ingestão de Stream Multicanal]) --> ForkParallel{Disparo Paralelo de IAs}

    ForkParallel -->|Áudio Chunks| DMCA[Acoustic Fingerprinter SHA-256]
    ForkParallel -->|Frames PPM| Vision[Computer Vision Safety Pipeline]
    ForkParallel -->|Mensagens de Chat| Chat[NLP & Velocity Analyzer]
    ForkParallel -->|Vídeo Frames 8x9| Piracy[Video dHash Perceptual]

    %% Ramo Áudio
    DMCA --> CheckAudio{Match no Catálogo Fonográfico?}
    CheckAudio -->|Sim| MuteTrack[Audio Mute Automático & Strike DMCA]
    CheckAudio -->|Não| AudioSafe[Áudio Aprovado]

    %% Ramo Visão (Nudez / Gore)
    Vision --> YCbCr[Peer/Kovac YCbCr + Kolkur HSV]
    YCbCr --> Blob[Connected-Component Blob Flood-Fill]
    Vision --> Sobel[Sobel 3x3 Texture Edge Variance]
    Blob --> CheckVision{Violação de Nudez ou Gore?}
    Sobel --> CheckVision
    CheckVision -->|Gore Extremo| KillStream[Encerramento Compulsório de Live]
    CheckVision -->|Nudez / Gore Leve| Gate18[Aplicação de Content Warning Gate 18+]
    CheckVision -->|Seguro| VisionSafe[Frame Aprovado]

    %% Ramo Chat
    Chat --> Shannon[Cálculo de Entropia de Shannon H]
    Chat --> Raid[Janela Deslizante de Velocidade & Levenshtein]
    Shannon --> CheckChat{Spam, Phishing ou Toxicidade?}
    Raid --> CheckRaid{Velocidade > 8 msg/s?}
    CheckChat -->|Sim| AutoModTimeout[Mensagem Deletada & Timeout 60s]
    CheckChat -->|Não| ChatSafe[Mensagem Enviada]
    CheckRaid -->|Sim| ShieldMode[Ativação Automática de Shield Mode]
    CheckRaid -->|Não| ChatNormal[Fluxo Normal]

    %% Ramo Pirataria
    Piracy --> CheckPiracy{Hamming Distance <= 10?}
    CheckPiracy -->|Sim| Takedown[Derrubada Judicial de PPV]
    CheckPiracy -->|Não| PiracySafe[Transmissão Autorizada]

    %% Notificação ao Humano
    MuteTrack --> ModView[Notificação no ModView Humano]
    Gate18 --> ModView
    KillStream --> ModView
    ShieldMode --> ModView
    Takedown --> ModView
    ModView --> HumanAudit[Auditoria Manual: Ban ou Manutenção]
    HumanAudit --> End([Transmissão Monitorada])
    AudioSafe --> End
    VisionSafe --> End
    ChatSafe --> End
    ChatNormal --> End
    PiracySafe --> End
""",

    "diagrama_componentes_arquitetura": """flowchart TB
    subgraph ClientLayer ["Camada de Apresentação & Clientes"]
        BrowserDashboard["Dashboard Web do Streamer / ModView (HTTP + WebSocket)"]
        ExternalPlatforms["Plataformas Externas (Twitch, YouTube Live, Kick)"]
    end

    subgraph ServerLayer ["Servidor & Engine de Streaming (src/engine/server)"]
        StreamServer["StreamServer (Node.js HTTP Server :3333)"]
        WSServer["WebSocket Server (Event Broadcast)"]
        RESTAPI["Controladores REST (/api/stream, /api/chat, /api/moderation)"]
    end

    subgraph GoFCore ["Núcleo de Padrões GoF Comportamentais (src/patterns)"]
        StreamChannel["ConcreteSubject & Context: StreamChannel"]
        DispatchStrategyInterface["Strategy Interface: INotificationDispatchStrategy"]
        SyncStrategy["ConcreteStrategy A: SynchronousBlocking"]
        AsyncStrategy["ConcreteStrategy B: AsynchronousConcurrent (Worker Pool)"]
        ObserverInterface["Observer Interface: IObserver"]
    end

    subgraph ModerationObservers ["Observadores Especializados de Moderação (src/patterns/observer/observers)"]
        AutoModObs["AutoModObserver"]
        SafetyObs["SafetyVisionModerationObserver"]
        DMCAObs["CopyrightDMCAAudioObserver"]
        RaidObs["ChatRaidShieldObserver"]
        PiracyObs["PiracyVideoRestreamObserver"]
        ModViewObs["HumanModeratorDashboardObserver"]
    end

    subgraph AlgorithmLayer ["Módulos de Algoritmos Reais (src/engine/algorithms)"]
        TextEntropy["TextEntropyAnalyzer (Shannon Entropy & Leetspeak)"]
        CVFilter["ComputerVisionFilter (YCbCr, HSV, Blob Flood-Fill, Sobel)"]
        Fingerprinter["AcousticFingerprinter (SHA-256 Spectral Hashing)"]
        RaidFilter["ChatRaidVelocityFilter (Sliding Window & Levenshtein)"]
        VideoHasher["VideoPerceptualHasher (64-bit dHash & Hamming Distance)"]
    end

    BrowserDashboard <--> RESTAPI
    BrowserDashboard <--> WSServer
    RESTAPI --> StreamChannel
    StreamServer --> StreamChannel
    StreamChannel --> DispatchStrategyInterface
    DispatchStrategyInterface <|-- SyncStrategy
    DispatchStrategyInterface <|-- AsyncStrategy
    StreamChannel --> ObserverInterface

    ObserverInterface <|-- AutoModObs
    ObserverInterface <|-- SafetyObs
    ObserverInterface <|-- DMCAObs
    ObserverInterface <|-- RaidObs
    ObserverInterface <|-- PiracyObs
    ObserverInterface <|-- ModViewObs

    AutoModObs --> TextEntropy
    SafetyObs --> CVFilter
    DMCAObs --> Fingerprinter
    RaidObs --> RaidFilter
    PiracyObs --> VideoHasher
""",

    "diagrama_casos_de_uso": """flowchart LR
    Streamer((Streamer))
    Viewer((Espectador / Spammer))
    ModHumano((Moderador Humano))
    SistemaIA((Sistema de IA & Moderação))

    subgraph UGCPlatform ["Plataforma de Streaming UGC (Twitch, YouTube, Kick)"]
        UC1([Iniciar Transmissão ao Vivo])
        UC2([Atualizar Metadados de Jogo/Título])
        UC3([Enviar Mensagem no Chat])
        UC4([Filtrar Spam e Entropia Anômala])
        UC5([Detectar Ataque de Chat Raid e Ativar Shield Mode])
        UC6([Inspecionar Nudez via YCbCr e Blobs Contíguos])
        UC7([Inspecionar Gore via Sobel e Sangue Hemático])
        UC8([Aplicar Gate 18+ Content Warning])
        UC9([Identificar Áudio Protegido via Fingerprint DMCA])
        UC10([Silenciar Faixa de Áudio da Live])
        UC11([Detectar Retransmissão Pirata de Vídeo via dHash])
        UC12([Encerrar Live Compulsoriamente])
        UC13([Auditar Incidentes no ModView])
        UC14([Aplicar Banimento Permanente ou Timeout Manual])
    end

    Streamer --> UC1
    Streamer --> UC2
    Viewer --> UC3

    UC3 --> UC4
    UC3 --> UC5
    SistemaIA --> UC4
    SistemaIA --> UC5
    SistemaIA --> UC6
    SistemaIA --> UC7
    SistemaIA --> UC9
    SistemaIA --> UC11

    UC6 --> UC8
    UC7 --> UC8
    UC7 -.->|Gore Extremo| UC12
    UC9 --> UC10
    UC11 --> UC12

    UC8 --> UC13
    UC10 --> UC13
    UC12 --> UC13

    ModHumano --> UC13
    ModHumano --> UC14
"""
}

out_dir = "docs/diagramas"
os.makedirs(out_dir, exist_ok=True)
artifact_dir = "/home/eduardolm/.gemini/antigravity-acp/brain/d244d805-88f0-4b68-8db5-3bf32ad63de4"
headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}

for name, code in EXTRA_DIAGRAMS.items():
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

print("TODOS OS DIAGRAMAS EXTRAS GERADOS COM SUCESSO!")
