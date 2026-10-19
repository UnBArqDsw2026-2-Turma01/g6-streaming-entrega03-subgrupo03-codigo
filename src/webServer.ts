import http from 'node:http';
import { StreamChannel } from './patterns/observer/StreamChannel.js';
import { AutoModObserver } from './patterns/observer/observers/AutoModObserver.js';
import { SafetyVisionModerationObserver } from './patterns/observer/observers/SafetyVisionModerationObserver.js';
import { CopyrightDMCAAudioObserver } from './patterns/observer/observers/CopyrightDMCAAudioObserver.js';
import { HumanModeratorDashboardObserver } from './patterns/observer/observers/HumanModeratorDashboardObserver.js';
import { PushNotificationObserver } from './patterns/observer/observers/PushNotificationObserver.js';
import { DiscordWebhookObserver } from './patterns/observer/observers/DiscordWebhookObserver.js';
import { ChatRaidShieldObserver } from './patterns/observer/observers/ChatRaidShieldObserver.js';
import { PiracyVideoRestreamObserver } from './patterns/observer/observers/PiracyVideoRestreamObserver.js';
import { AsynchronousConcurrentDispatchStrategy } from './patterns/strategy/AsynchronousConcurrentDispatchStrategy.js';
import { SynchronousBlockingDispatchStrategy } from './patterns/strategy/SynchronousBlockingDispatchStrategy.js';
import { IObserver, StreamEvent } from './patterns/observer/interfaces.js';

const PORT = 3333;

// Inicializa o Subject canônico do GoF Observer
const channel = new StreamChannel(
  'canal_eduardo_unb',
  'Eduardo Lôbo [UnB Gaming]',
  'TWITCH',
  'Software Architecture & Gaming'
);

// Observadores especializados
const autoMod = new AutoModObserver('obs-automod', 'AutoMod Shannon Filter');
const safetyVision = new SafetyVisionModerationObserver('obs-safety', 'Safety Vision AI (YCbCr/Sobel)');
const dmcaAudio = new CopyrightDMCAAudioObserver('obs-dmca', 'DMCA Content ID Audio');
const modView = new HumanModeratorDashboardObserver('obs-modview', 'ModView Admin Dashboard');
const pushNotif = new PushNotificationObserver('obs-push', 'Mobile Push FCM');
const discordWebhook = new DiscordWebhookObserver('obs-discord', 'Discord Announcement Bot', 'Comunidade UnB FGA', 'https://discord.com/api/webhooks/unb-fga', 0);
const chatRaidShield = new ChatRaidShieldObserver('obs-shield', 'Chat Raid Shield Bot Detector');
const piracyDetector = new PiracyVideoRestreamObserver('obs-piracy', 'Video Piracy dHash Detector');

// Registra todos os observadores no Subject
channel.attach(autoMod);
channel.attach(safetyVision);
channel.attach(dmcaAudio);
channel.attach(modView);
channel.attach(pushNotif);
channel.attach(discordWebhook);
channel.attach(chatRaidShield);
channel.attach(piracyDetector);

// Histórico de eventos e clientes SSE conectados
interface AuditItem {
  id: string;
  timestamp: string;
  eventType: string;
  severity?: string;
  detail: string;
  actionApplied?: string;
}

const auditLog: AuditItem[] = [];
const sseClients: http.ServerResponse[] = [];

// Observador visual Web conectado ao SSE
const webDashboardObserver: IObserver = {
  id: 'obs-web-dashboard',
  name: 'Realtime Web Dashboard Observer',
  targetSystem: 'Web ModView UI',
  update: (event: StreamEvent) => {
    const item: AuditItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      eventType: event.type,
      severity: event.moderationInfo?.severity || (event.type.includes('VIOLATION') ? 'CRITICAL' : 'INFO'),
      detail: event.moderationInfo?.detectedEntity || event.payload.title,
      actionApplied: event.moderationInfo?.actionApplied || 'NOTIFICATION_DISPATCHED'
    };

    auditLog.unshift(item);
    if (auditLog.length > 50) auditLog.pop();

    broadcastSSE({
      type: 'EVENT',
      event: item,
      channelState: channel.getState(),
      strategy: channel.getDispatchStrategyName()
    });
  }
};

channel.attach(webDashboardObserver);

function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>StreamSentry — ModView Dashboard (GoF Observer)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #0e0e10;
      --card-bg: #18181b;
      --card-border: #2e2e35;
      --text: #efeff1;
      --text-dim: #adadb8;
      --purple: #9146ff;
      --purple-hover: #772ce8;
      --green: #00f59b;
      --red: #eb0400;
      --yellow: #f5a623;
      --blue: #1f6feb;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 16px; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; margin-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    .badge-live { background: rgba(0, 245, 155, 0.2); color: var(--green); border: 1px solid var(--green); }
    .badge-offline { background: rgba(173, 173, 184, 0.2); color: var(--text-dim); border: 1px solid var(--text-dim); }
    .badge-warning { background: rgba(245, 166, 35, 0.2); color: var(--yellow); border: 1px solid var(--yellow); }
    .badge-terminal { background: rgba(235, 4, 0, 0.2); color: var(--red); border: 1px solid var(--red); }
    
    .grid { display: grid; grid-template-columns: 320px 1fr 340px; gap: 16px; }
    @media(max-width: 1024px) { .grid { grid-template-columns: 1fr; } }
    
    .card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .card h2 { font-size: 1rem; color: var(--text-dim); border-bottom: 1px solid var(--card-border); padding-bottom: 8px; }
    
    /* Control Panel */
    .btn { background: var(--purple); color: #fff; border: none; padding: 10px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.85rem; width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; }
    .btn:hover { background: var(--purple-hover); }
    .btn-danger { background: #3c1212; border: 1px solid var(--red); color: #ff8888; }
    .btn-danger:hover { background: #5c1818; }
    .btn-warning { background: #3b2c11; border: 1px solid var(--yellow); color: #ffd288; }
    .btn-warning:hover { background: #5a4216; }
    .btn-secondary { background: #22272e; border: 1px solid var(--card-border); color: var(--text); }
    .btn-secondary:hover { background: #2d333b; }
    
    /* Audit Log Feed */
    .feed { flex: 1; max-height: 640px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .feed-item { background: #222227; border-left: 4px solid var(--blue); padding: 10px 12px; border-radius: 4px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; }
    .feed-item.CRITICAL { border-left-color: var(--yellow); }
    .feed-item.TERMINAL { border-left-color: var(--red); background: #281515; }
    .feed-header { display: flex; justify-content: space-between; color: var(--text-dim); font-size: 0.75rem; }
    .feed-detail { font-weight: 600; color: #fff; word-break: break-word; }
    .feed-action { color: var(--green); font-family: monospace; font-size: 0.75rem; }
    
    /* Stats & Observers */
    .stat-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0; border-bottom: 1px dashed #26262b; }
    .stat-label { color: var(--text-dim); }
    .stat-val { font-weight: 600; }
    
    .obs-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
    .obs-item { background: #202025; padding: 8px 10px; border-radius: 4px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span style="font-size: 1.5rem;">🛡️</span>
      <div>
        <h1>StreamSentry · ModView Realtime Dashboard</h1>
        <small style="color: var(--text-dim)">Padrão GoF Observer + Strategy · SubEquipe 03 (Moderação Reativa)</small>
      </div>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <span id="strategyBadge" class="badge" style="background: rgba(145, 70, 255, 0.2); color: var(--purple); border: 1px solid var(--purple);">Strategy: Async Concorrente</span>
      <span id="statusBadge" class="badge badge-offline">OFFLINE</span>
    </div>
  </header>

  <main class="grid">
    <!-- Painel de Disparo de Eventos -->
    <section class="card">
      <h2>🎮 Painel de Disparo (GoF Actions)</h2>
      <button class="btn" onclick="sendAction('golive')">⚡ 1. Iniciar Transmissão (goLive)</button>
      <button class="btn btn-secondary" onclick="sendAction('chat_toxic')">💬 2. Enviar Chat com Spam/Aimbot (AutoMod)</button>
      <button class="btn btn-warning" onclick="sendAction('nsfw')">🔞 3. Injetar Nudez YCbCr 64% (Content Warning)</button>
      <button class="btn btn-warning" onclick="sendAction('dmca')">🎵 4. Injetar DMCA Eminem (Mute de Áudio)</button>
      <button class="btn btn-secondary" onclick="sendAction('piracy')">🛑 5. Injetar Vídeo Pirata dHash 64-bit (PPV)</button>
      <button class="btn btn-secondary" onclick="sendAction('raid')">🤖 6. Disparar Chat Raid (Shield Mode)</button>
      <button class="btn btn-secondary" onclick="sendAction('ban')">🔨 7. Ação Manual ModView (Banir User)</button>
      <button class="btn btn-secondary" onclick="sendAction('toggle_strategy')">🔄 8. Alternar Strategy (Sync / Async)</button>
      <button class="btn btn-danger" onclick="sendAction('gore')">🩸 9. Injetar Sangue 36% (Takedown Terminal)</button>
      <button class="btn btn-secondary" onclick="sendAction('endlive')">⏹️ 10. Encerrar Live (endLive)</button>
    </section>

    <!-- Feed de Auditoria Reativo -->
    <section class="card">
      <h2>📜 Feed de Incidentes Reativos (IObserver.update)</h2>
      <div id="feedList" class="feed">
        <div class="feed-item INFO">
          <div class="feed-header">
            <span>SISTEMA INICIADO</span>
            <span>Agora</span>
          </div>
          <div class="feed-detail">Aguardando eventos do StreamChannel (Concrete Subject)...</div>
          <div class="feed-action">OBSERVERS_READY</div>
        </div>
      </div>
    </section>

    <!-- Estado do Sujeito e Observadores -->
    <section class="card">
      <h2>📊 Estado Canônico (getState())</h2>
      <div class="stat-row"><span class="stat-label">Canal / Streamer:</span><span id="stStreamer" class="stat-val">Eduardo Lôbo</span></div>
      <div class="stat-row"><span class="stat-label">Plataforma:</span><span id="stPlatform" class="stat-val">TWITCH</span></div>
      <div class="stat-row"><span class="stat-label">Título:</span><span id="stTitle" class="stat-val">Transmissão Offline</span></div>
      <div class="stat-row"><span class="stat-label">Categoria:</span><span id="stCategory" class="stat-val">Software Engineering</span></div>
      <div class="stat-row"><span class="stat-label">Espectadores:</span><span id="stViewers" class="stat-val">0</span></div>
      <div class="stat-row"><span class="stat-label">Content Warning 18+:</span><span id="stGate" class="stat-val" style="color:var(--green)">NÃO</span></div>
      <div class="stat-row"><span class="stat-label">Áudio Mutado:</span><span id="stMuted" class="stat-val" style="color:var(--green)">NÃO</span></div>
      <div class="stat-row"><span class="stat-label">Strikes Acumulados:</span><span id="stStrikes" class="stat-val">0</span></div>

      <h2 style="margin-top: 10px;">👥 Observadores Anexados (<span id="obsCount">9</span>)</h2>
      <div class="obs-list">
        <div class="obs-item"><span>AutoMod Shannon Filter</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Safety Vision AI (YCbCr/Sobel)</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>DMCA Audio Content ID</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>ModView Admin Dashboard</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Push Notification FCM</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Discord Community Webhook</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Chat Raid Shield AI</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Video Piracy dHash</span><span style="color:var(--green)">ATTACHED</span></div>
        <div class="obs-item"><span>Web ModView Realtime</span><span style="color:var(--purple)">LIVE SSE</span></div>
      </div>
    </section>
  </main>

  <script>
    function updateUI(state, strategy) {
      if (!state) return;
      const statusBadge = document.getElementById('statusBadge');
      statusBadge.textContent = state.status;
      statusBadge.className = 'badge ' + (
        state.status === 'LIVE' ? 'badge-live' :
        state.status.includes('WARNING') ? 'badge-warning' :
        state.status.includes('TERMINATED') ? 'badge-terminal' : 'badge-offline'
      );

      if (strategy) {
        document.getElementById('strategyBadge').textContent = 'Strategy: ' + strategy;
      }

      document.getElementById('stTitle').textContent = state.metadata.title;
      document.getElementById('stCategory').textContent = state.metadata.category;
      document.getElementById('stViewers').textContent = state.metadata.viewerCount;
      document.getElementById('stGate').textContent = state.metadata.hasContentWarning ? 'ATIVO (18+)' : 'NÃO';
      document.getElementById('stGate').style.color = state.metadata.hasContentWarning ? 'var(--yellow)' : 'var(--green)';
      document.getElementById('stMuted').textContent = state.metadata.isAudioMuted ? 'MUTADO (DMCA)' : 'NÃO';
      document.getElementById('stMuted').style.color = state.metadata.isAudioMuted ? 'var(--red)' : 'var(--green)';
      document.getElementById('stStrikes').textContent = state.metadata.strikeCount;
      document.getElementById('obsCount').textContent = state.activeObserversCount;
    }

    function addFeedItem(event) {
      const feed = document.getElementById('feedList');
      const item = document.createElement('div');
      item.className = 'feed-item ' + (event.severity || 'INFO');
      item.innerHTML = \`
        <div class="feed-header">
          <span>\${event.eventType} (\${event.severity || 'INFO'})</span>
          <span>\${event.timestamp}</span>
        </div>
        <div class="feed-detail">\${event.detail}</div>
        <div class="feed-action">\${event.actionApplied || 'UPDATED'}</div>
      \`;
      feed.prepend(item);
    }

    const evtSource = new EventSource('/events');
    evtSource.onmessage = function(e) {
      const data = JSON.parse(e.data);
      if (data.type === 'EVENT') {
        addFeedItem(data.event);
        updateUI(data.channelState, data.strategy);
      } else if (data.type === 'INIT') {
        updateUI(data.channelState, data.strategy);
        data.history.forEach(addFeedItem);
      }
    };

    async function sendAction(act) {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: act })
      });
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const reqUrl = req.url ? req.url.split('?')[0] : '/';
  if ((req.method === 'GET' || req.method === 'HEAD') && (reqUrl === '/' || reqUrl === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(HTML_CONTENT);
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write(`data: ${JSON.stringify({
      type: 'INIT',
      channelState: channel.getState(),
      strategy: channel.getDispatchStrategyName(),
      history: auditLog
    })}\n\n`);

    sseClients.push(res);
    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/action') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { action } = JSON.parse(body || '{}');

        switch (action) {
          case 'golive':
            await channel.goLive('Live Oficial StreamSentry UnB FGA', 'Software Engineering', ['unb', 'gof', 'observer'], 250);
            break;
          case 'chat_toxic':
            await channel.processChatMessage('spammer_bot', 'use this aimbot and hack now on discord');
            break;
          case 'nsfw':
            await channel.flagContentSafetyViolation('NUDITY_NSFW', 0.96, 'Frame PPM: Densidade Dérmica YCbCr 64% (Hentai / Conteúdo Explícito)', 'CRITICAL');
            break;
          case 'gore':
            await channel.flagContentSafetyViolation('GORE', 0.99, 'Frame PPM: Sangue Arterial 36% (Sobel: 67.0) - Takedown Terminal', 'TERMINAL');
            break;
          case 'dmca':
            await channel.flagCopyrightDMCA('Lose Yourself - Eminem (Universal Music)', 0.98);
            break;
          case 'piracy':
            await channel.flagVideoPiracyViolation('ff808080808080fe', 0.984);
            break;
          case 'raid':
            for (let i = 0; i < 4; i++) {
              await channel.processChatMessage(`bot_${i}`, 'BUY CHEAP VIEWERS ON BESTSTREAMS.ONLINE 50% OFF');
            }
            break;
          case 'ban':
            await channel.executeModeratorAction('mod_eduardo_unb', 'BAN_PERMANENT_USER: toxic_spammer');
            break;
          case 'toggle_strategy':
            if (channel.getDispatchStrategyName().includes('Assíncrono')) {
              channel.setDispatchStrategy(new SynchronousBlockingDispatchStrategy());
            } else {
              channel.setDispatchStrategy(new AsynchronousConcurrentDispatchStrategy(150));
            }
            broadcastSSE({
              type: 'EVENT',
              event: {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toLocaleTimeString(),
                eventType: 'STRATEGY_TOGGLED',
                severity: 'INFO',
                detail: `GoF Strategy alterado para: ${channel.getDispatchStrategyName()}`,
                actionApplied: 'STRATEGY_UPDATED'
              },
              channelState: channel.getState(),
              strategy: channel.getDispatchStrategyName()
            });
            break;
          case 'endlive':
            await channel.endLive();
            break;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, state: channel.getState() }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\x1b[32m\x1b[1m🚀 StreamSentry Web ModView Dashboard rodando em:\x1b[0m \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[33m💡 Abra a URL no navegador para testar visualmente o padrão GoF Observer em tempo real!\x1b[0m`);
});
