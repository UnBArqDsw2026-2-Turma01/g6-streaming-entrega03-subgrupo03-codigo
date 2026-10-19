import base64
import urllib.request
import os
import json
import time

DIAGRAMS = {
    "diagrama_atividades_pipeline": """flowchart TD
    Start([Ingestao de Stream Multicanal]) --> ForkParallel{Disparo Paralelo de IAs}

    ForkParallel -->|Audio Chunks| DMCA[Acoustic Fingerprinter SHA-256]
    ForkParallel -->|Frames PPM| Vision[Computer Vision Safety Pipeline]
    ForkParallel -->|Mensagens de Chat| Chat[NLP e Velocity Analyzer]
    ForkParallel -->|Video Frames 8x9| Piracy[Video dHash Perceptual]

    DMCA --> CheckAudio{Match no Catalogo Fonografico}
    CheckAudio -->|Sim| MuteTrack[Audio Mute Automatico e Strike DMCA]
    CheckAudio -->|Nao| AudioSafe[Audio Aprovado]

    Vision --> YCbCr[Peer/Kovac YCbCr e Kolkur HSV]
    YCbCr --> Blob[Connected Component Blob Flood Fill]
    Vision --> Sobel[Sobel 3x3 Texture Edge Variance]
    Blob --> CheckVision{Violacao de Nudez ou Gore}
    Sobel --> CheckVision
    CheckVision -->|Gore Extremo| KillStream[Encerramento Compulsorio de Live]
    CheckVision -->|Nudez ou Gore Leve| Gate18[Aplicacao de Content Warning Gate 18+]
    CheckVision -->|Seguro| VisionSafe[Frame Aprovado]

    Chat --> Shannon[Calculo de Entropia de Shannon H]
    Chat --> Raid[Janela Deslizante de Velocidade e Levenshtein]
    Shannon --> CheckChat{Spam Phishing ou Toxicidade}
    Raid --> CheckRaid{Velocidade Alta de Bots}
    CheckChat -->|Sim| AutoModTimeout[Mensagem Deletada e Timeout 60s]
    CheckChat -->|Nao| ChatSafe[Mensagem Enviada]
    CheckRaid -->|Sim| ShieldMode[Ativacao Automatica de Shield Mode]
    CheckRaid -->|Nao| ChatNormal[Fluxo Normal]

    Piracy --> CheckPiracy{Distancia Hamming Menor que 10}
    CheckPiracy -->|Sim| Takedown[Derrubada Judicial de PPV]
    CheckPiracy -->|Nao| PiracySafe[Transmissao Autorizada]

    MuteTrack --> ModView[Notificacao no ModView Humano]
    Gate18 --> ModView
    KillStream --> ModView
    ShieldMode --> ModView
    Takedown --> ModView
    ModView --> HumanAudit[Auditoria Manual: Ban ou Manutencao]
    HumanAudit --> End([Transmissao Monitorada])
    AudioSafe --> End
    VisionSafe --> End
    ChatSafe --> End
    ChatNormal --> End
    PiracySafe --> End
""",

    "diagrama_componentes_arquitetura": """flowchart TB
    subgraph ClientLayer [Camada de Apresentacao e Clientes]
        BrowserDashboard[Dashboard Web do Streamer e ModView - HTTP e WebSocket]
        ExternalPlatforms[Plataformas Externas - Twitch, YouTube Live, Kick]
    end

    subgraph ServerLayer [Servidor e Engine de Streaming]
        StreamServer[StreamServer Node.js HTTP Server na porta 3333]
        WSServer[WebSocket Server - Event Broadcast]
        RESTAPI[Controladores REST api/stream, api/chat, api/moderation]
    end

    subgraph GoFCore [Nucleo de Padroes GoF Comportamentais]
        StreamChannel[ConcreteSubject e Context: StreamChannel]
        DispatchStrategyInterface[Strategy Interface: INotificationDispatchStrategy]
        SyncStrategy[ConcreteStrategy A: SynchronousBlocking]
        AsyncStrategy[ConcreteStrategy B: AsynchronousConcurrent Worker Pool]
        ObserverInterface[Observer Interface: IObserver]
    end

    subgraph ModerationObservers [Observadores Especializados de Moderacao]
        AutoModObs[AutoModObserver - Shannon Entropy]
        SafetyObs[SafetyVisionModerationObserver - YCbCr HSV Sobel Blobs]
        DMCAObs[CopyrightDMCAAudioObserver - Acoustic Fingerprint]
        RaidObs[ChatRaidShieldObserver - Sliding Window Levenshtein]
        PiracyObs[PiracyVideoRestreamObserver - 64-bit dHash]
        ModViewObs[HumanModeratorDashboardObserver - ModView Feed]
    end

    subgraph AlgorithmLayer [Modulos de Algoritmos Reais]
        TextEntropy[TextEntropyAnalyzer]
        CVFilter[ComputerVisionFilter]
        Fingerprinter[AcousticFingerprinter]
        RaidFilter[ChatRaidVelocityFilter]
        VideoHasher[VideoPerceptualHasher]
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
    SistemaIA((Sistema de IA e Moderacao))

    subgraph UGCPlatform [Plataforma de Streaming UGC - Twitch, YouTube, Kick]
        UC1([Iniciar Transmissao ao Vivo])
        UC2([Atualizar Metadados de Jogo e Titulo])
        UC3([Enviar Mensagem no Chat])
        UC4([Filtrar Spam e Entropia Anomala])
        UC5([Detectar Ataque de Chat Raid e Ativar Shield Mode])
        UC6([Inspecionar Nudez via YCbCr e Blobs Contiguos])
        UC7([Inspecionar Gore via Sobel e Sangue Hematico])
        UC8([Aplicar Gate 18+ Content Warning])
        UC9([Identificar Audio Protegido via Fingerprint DMCA])
        UC10([Silenciar Faixa de Audio da Live])
        UC11([Detectar Retransmissao Pirata de Video via dHash])
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

for name, code in DIAGRAMS.items():
    print(f"Gerando {name}...")
    payload = json.dumps({"code": code, "mermaid": {"theme": "default"}})
    b64 = base64.b64encode(payload.encode("utf-8")).decode("ascii")

    # SVG
    url_svg = f"https://mermaid.ink/svg/{b64}"
    req_svg = urllib.request.Request(url_svg, headers=headers)
    with urllib.request.urlopen(req_svg, timeout=20) as resp:
        svg_bytes = resp.read()
        svg_path = os.path.join(out_dir, f"{name}.svg")
        with open(svg_path, "wb") as f:
            f.write(svg_bytes)
        print(f"  -> SVG: {svg_path} ({len(svg_bytes)} bytes)")

    # PNG
    url_png = f"https://mermaid.ink/img/{b64}"
    req_png = urllib.request.Request(url_png, headers=headers)
    with urllib.request.urlopen(req_png, timeout=20) as resp:
        png_bytes = resp.read()
        png_path = os.path.join(out_dir, f"{name}.png")
        with open(png_path, "wb") as f:
            f.write(png_bytes)
        print(f"  -> PNG: {png_path} ({len(png_bytes)} bytes)")

        artifact_png = os.path.join(artifact_dir, f"{name}.png")
        with open(artifact_png, "wb") as f:
            f.write(png_bytes)
        print(f"  -> Artifact: {artifact_png}")

print("TODOS OS DIAGRAMAS COMPLEMENTARES GERADOS COM SUCESSO!")
