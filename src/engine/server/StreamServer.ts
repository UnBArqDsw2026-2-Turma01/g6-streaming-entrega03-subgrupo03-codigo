import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { StreamChannel } from '../../patterns/observer/StreamChannel.js';
import { AutoModObserver } from '../../patterns/observer/observers/AutoModObserver.js';
import { SafetyVisionModerationObserver } from '../../patterns/observer/observers/SafetyVisionModerationObserver.js';
import { CopyrightDMCAAudioObserver } from '../../patterns/observer/observers/CopyrightDMCAAudioObserver.js';
import { HumanModeratorDashboardObserver } from '../../patterns/observer/observers/HumanModeratorDashboardObserver.js';

export class StreamServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private channel: StreamChannel;
  private port: number;

  constructor(port = 3333) {
    this.port = port;

    // Instancia canal da Twitch
    this.channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH', 'Counter-Strike 2');

    // Registra observadores reais
    const autoMod = new AutoModObserver();
    const safetyVision = new SafetyVisionModerationObserver();
    const dmca = new CopyrightDMCAAudioObserver();
    const modView = new HumanModeratorDashboardObserver('obs-mod', 'Mod Head', 'guardian_unb');

    this.channel.attach(autoMod);
    this.channel.attach(safetyVision);
    this.channel.attach(dmca);
    this.channel.attach(modView);

    // Servidor HTTP
    this.server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://localhost:${this.port}`);

      // API: Iniciar Live
      if (url.pathname === '/api/stream/start' && req.method === 'POST') {
        await this.channel.goLive('CS2 COMPETITIVE - PRO MATCH [US]', 'Counter-Strike 2', ['fps', 'cs2'], 15000);
        this.broadcastState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state: this.channel.getState() }));
        return;
      }

      // API: Enviar Mensagem de Chat (AutoMod)
      if (url.pathname === '/api/chat/send' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const sender = data.sender || 'viewer_anonymous';
            const message = data.message || '';
            const report = await this.channel.processChatMessage(sender, message);
            this.broadcastState();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, report, state: this.channel.getState() }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
        return;
      }

      // API: Inspecionar Segurança Visual (Gore / Nudez)
      if (url.pathname === '/api/moderation/safety' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = JSON.parse(body || '{}');
          const flag = data.flagType || 'GORE';
          const sample = flag === 'GORE' ? 'test_media/gore_sample.ppm' : 'test_media/skin_sample.ppm';
          await this.channel.flagContentSafetyViolation(flag, 0.96, sample, 'CRITICAL');
          this.broadcastState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: this.channel.getState() }));
        });
        return;
      }

      // API: Inspecionar DMCA / Direitos Autorais
      if (url.pathname === '/api/moderation/dmca' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const data = JSON.parse(body || '{}');
          const track = data.track || 'Eminem - Lose Yourself';
          await this.channel.flagCopyrightDMCA(track, 0.98);
          this.broadcastState();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, state: this.channel.getState() }));
        });
        return;
      }

      // Página Web do Dashboard de Moderação (HTML / CSS / JS)
      if (url.pathname === '/' || url.pathname === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(this.renderDashboardHtml());
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    // Servidor WebSocket
    this.wss = new WebSocketServer({ server: this.server });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'INIT_STATE', state: this.channel.getState() }));
    });
  }

  private broadcastState(): void {
    const payload = JSON.stringify({
      type: 'STATE_UPDATED',
      state: this.channel.getState()
    });

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`\x1b[32m✔ StreamSentry Engine rodando em: http://localhost:${this.port}\x1b[0m`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => resolve());
      });
    });
  }

  private renderDashboardHtml(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>StreamSentry - GoF Observer Live Moderation Engine</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0e0e10; color: #efeff1; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #772ce8; padding-bottom: 15px; }
    .badge { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
    .badge-live { background: #eb0400; color: #fff; }
    .badge-warn { background: #f5a623; color: #000; }
    .badge-mute { background: #4a90e2; color: #fff; }
    .badge-offline { background: #3a3a3d; color: #adadb8; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .card { background: #18181b; border: 1px solid #303032; border-radius: 8px; padding: 20px; }
    h2 { margin-top: 0; color: #bf94ff; font-size: 18px; }
    button { background: #9146ff; color: #fff; border: none; padding: 10px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-right: 8px; margin-bottom: 8px; }
    button:hover { background: #772ce8; }
    button.danger { background: #eb0400; }
    input[type=text] { width: 70%; padding: 10px; background: #26262c; border: 1px solid #464649; color: #fff; border-radius: 4px; }
    pre { background: #000; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; color: #00ff66; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🛡 StreamSentry: Engine de Moderação Reativa (GoF Observer)</h1>
      <p style="color: #adadb8; margin: 0;">Twitch / YouTube / Kick Live Inspector | SubEquipe 03 - Desenho de Software (UnB Gama)</p>
    </div>
    <div id="statusBadge" class="badge badge-offline">CARREGANDO...</div>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Controle de Transmissão & Moderação</h2>
      <button onclick="startStream()">🔴 Iniciar Live (Dima Wallhacks)</button>
      <button onclick="testGore()" class="danger">🩸 Injetar Sample de Gore (Vision AI)</button>
      <button onclick="testSkin()" style="background: #e67e22;">🔞 Injetar Sample NSFW (YCbCr)</button>
      <button onclick="testDmca()" style="background: #2980b9;">🎵 Tocar Eminem (DMCA Mute)</button>
      
      <h3 style="margin-top: 20px; font-size: 15px;">💬 Enviar Mensagem no Chat (AutoMod Real):</h3>
      <div style="display: flex;">
        <input type="text" id="chatInput" placeholder="Digite uma mensagem ou tente: free_bits, hack, etc.">
        <button onclick="sendChat()" style="margin-left: 8px;">Enviar</button>
      </div>
    </div>

    <div class="card">
      <h2>Estado Atual do Subject (StreamChannel)</h2>
      <pre id="stateOutput">Aguardando conexão WebSocket...</pre>
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://' + window.location.host);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      updateUI(data.state);
    };

    function updateUI(state) {
      document.getElementById('stateOutput').textContent = JSON.stringify(state, null, 2);
      const badge = document.getElementById('statusBadge');
      badge.textContent = state.status;
      badge.className = 'badge ' + (
        state.status === 'LIVE' ? 'badge-live' :
        state.status === 'CONTENT_WARNING_RESTRICTED' ? 'badge-warn' :
        state.status === 'AUDIO_MUTED_COPYRIGHT' ? 'badge-mute' : 'badge-offline'
      );
    }

    async function startStream() {
      await fetch('/api/stream/start', { method: 'POST' });
    }

    async function sendChat() {
      const input = document.getElementById('chatInput');
      const message = input.value;
      if (!message) return;
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'viewer_live', message })
      });
      input.value = '';
    }

    async function testGore() {
      await fetch('/api/moderation/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagType: 'GORE' })
      });
    }

    async function testSkin() {
      await fetch('/api/moderation/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagType: 'NUDITY_NSFW' })
      });
    }

    async function testDmca() {
      await fetch('/api/moderation/dmca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track: 'Lose Yourself - Eminem' })
      });
    }
  </script>
</body>
</html>`;
  }
}
