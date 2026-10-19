import { ChatRaidShieldObserver } from './patterns/observer/observers/ChatRaidShieldObserver.js';
import { PiracyVideoRestreamObserver } from './patterns/observer/observers/PiracyVideoRestreamObserver.js';
import { StreamChannel } from './patterns/observer/StreamChannel.js';
import { AutoModObserver } from './patterns/observer/observers/AutoModObserver.js';
import { SafetyVisionModerationObserver } from './patterns/observer/observers/SafetyVisionModerationObserver.js';
import { CopyrightDMCAAudioObserver } from './patterns/observer/observers/CopyrightDMCAAudioObserver.js';
import { HumanModeratorDashboardObserver } from './patterns/observer/observers/HumanModeratorDashboardObserver.js';
import { PushNotificationObserver } from './patterns/observer/observers/PushNotificationObserver.js';
import { DiscordWebhookObserver } from './patterns/observer/observers/DiscordWebhookObserver.js';
import { InAppLiveBadgeObserver } from './patterns/observer/observers/InAppLiveBadgeObserver.js';
import { AsynchronousConcurrentDispatchStrategy } from './patterns/strategy/AsynchronousConcurrentDispatchStrategy.js';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runComprehensiveStreamingAndModerationDemo() {
  console.clear();
  console.log('='.repeat(85));
  console.log('\x1b[1m\x1b[35m  SISTEMA COMPLETO DE STREAMING UGC COM MODERAÇÃO REATIVA (GOF OBSERVER + STRATEGY)\x1b[0m');
  console.log('  SubEquipe 03 - Desenho de Software | Canais Reais: YouTube, Twitch e Kick');
  console.log('  Foco Especial: AutoMod, Visão Computacional (Gore/Nudez), DMCA e Moderação Humana');
  console.log('='.repeat(85));
  console.log();

  // -------------------------------------------------------------------------
  // 1. INSTANCIAÇÃO DOS CANAIS REAIS (Concrete Subjects)
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 1] Inicializando Canais Reais de UGC Streaming (Concrete Subjects)...\x1b[0m');
  
  // Canal 1: YouTube Live - Sorashina Sopia (VTuber / Gaming)
  const ytChannel = new StreamChannel(
    'SorashinaSopia', 
    'Sorashina Sopia [VTuber]', 
    'YOUTUBE_LIVE', 
    'Virtual YouTuber / JRPG'
  );

  // Canal 2: Twitch - Dima Wallhacks (Streamer Americano de FPS)
  const twitchChannel = new StreamChannel(
    'dima_wallhacks', 
    'Dima Wallhacks (US)', 
    'TWITCH', 
    'Counter-Strike 2 & Tactical FPS'
  );

  // Canal 3: Kick.com - eskimozin (Streamer Brasileiro)
  const kickChannel = new StreamChannel(
    'eskimozin', 
    'eskimozin (BR)', 
    'KICK', 
    'Just Chatting & IRL Brasil'
  );

  console.log(`✅ Canal 1: "${ytChannel.streamerName}" [${ytChannel.platform}] -> ${ytChannel.getMetadata().streamUrl}`);
  console.log(`✅ Canal 2: "${twitchChannel.streamerName}" [${twitchChannel.platform}] -> ${twitchChannel.getMetadata().streamUrl}`);
  console.log(`✅ Canal 3: "${kickChannel.streamerName}" [${kickChannel.platform}] -> ${kickChannel.getMetadata().streamUrl}`);
  console.log();
  await sleep(1500);

  // -------------------------------------------------------------------------
  // 2. REGISTRO DE OBSERVADORES DO PIPELINE DE MODERAÇÃO E NOTIFICAÇÃO
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 2] Anexando Observadores Especializados do Pipeline de Moderação (attach)...\x1b[0m');
  
  // Observadores de Moderação
  const autoMod = new AutoModObserver('obs-automod', 'AutoMod AI Text Classifier');
  const safetyVision = new SafetyVisionModerationObserver('obs-safety-vision', 'Computer Vision NSFW/Gore Analyzer');
  const dmcaAudio = new CopyrightDMCAAudioObserver('obs-dmca', 'Acoustic Fingerprint Copyright Detector');
  const raidShield = new ChatRaidShieldObserver('obs-raid', 'Chat Raid Velocity & Levenshtein Shield');
  const piracyVideo = new PiracyVideoRestreamObserver('obs-piracy', 'Video Piracy dHash Detector');
  const modDashboard = new HumanModeratorDashboardObserver('obs-modview', 'Lead Community Moderator', 'guardian_mod_unb');

  // Observadores de Distribuição e Viewers
  const pushMobile = new PushNotificationObserver('obs-push', 'Mobile Push Notifications', 'fcm-token-global');
  const discordAlerts = new DiscordWebhookObserver('obs-discord', 'Discord Multi-Community Bot', 'Hub Central de Transmissões', 'https://discord.com/api/webhooks/live-hub');
  const liveBadge = new InAppLiveBadgeObserver('obs-badge', 'Web App Live Sidebar Feed');

  // Conectar observadores ao canal da Twitch (Dima Wallhacks)
  twitchChannel.attach(autoMod);
  twitchChannel.attach(safetyVision);
  twitchChannel.attach(dmcaAudio);
  twitchChannel.attach(raidShield);
  twitchChannel.attach(piracyVideo);
  twitchChannel.attach(modDashboard);
  twitchChannel.attach(pushMobile);
  twitchChannel.attach(discordAlerts);
  twitchChannel.attach(liveBadge);

  // Conectar ao canal do YouTube (Sorashina Sopia)
  ytChannel.attach(autoMod);
  ytChannel.attach(safetyVision);
  ytChannel.attach(dmcaAudio);
  ytChannel.attach(modDashboard);
  ytChannel.attach(discordAlerts);

  // Conectar ao canal da Kick (eskimozin)
  kickChannel.attach(autoMod);
  kickChannel.attach(safetyVision);
  kickChannel.attach(dmcaAudio);
  kickChannel.attach(raidShield);
  kickChannel.attach(modDashboard);
  kickChannel.attach(discordAlerts);

  console.log(`✅ Pipeline de Moderação e Notificação ativado com ${twitchChannel.getObserversCount()} observadores.`);
  console.log();
  await sleep(1500);

  // -------------------------------------------------------------------------
  // 3. ABERTURA DE LIVE - DIMA WALLHACKS NA TWITCH
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 3] Dima Wallhacks inicia transmissão ao vivo na TWITCH (goLive)...\x1b[0m');
  console.log('-'.repeat(85));
  await twitchChannel.goLive(
    'PRO MATCH HIGHLIGHTS - ROAD TO GLOBAL ELITE [RANK 1 US]',
    'Counter-Strike 2',
    ['fps', 'esports', 'north-america'],
    14500
  );
  console.log('-'.repeat(85));
  console.log(`📊 Status da Live: \x1b[32m${twitchChannel.getStatus()}\x1b[0m | Viewers: ${twitchChannel.getMetadata().viewerCount}`);
  console.log();
  await sleep(2000);

  // -------------------------------------------------------------------------
  // 4. CENÁRIO DE MODERAÇÃO 1: AUTOMOD NO CHAT
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 4] Cenário AutoMod: Espectadores enviam mensagens no chat...\x1b[0m');
  console.log('-'.repeat(85));
  await twitchChannel.processChatMessage('fan_99', 'What an insane shot Dima!');
  await twitchChannel.processChatMessage('spammer_bot', 'GET FREE_BITS AND FREE_ROBUX AT HTTP://FAKE-TWITCH.COM NOW CLICK CLICK');
  await twitchChannel.processChatMessage('angry_user', 'I will doxx you and your team using hack tools!');
  console.log('-'.repeat(85));
  console.log(`✅ AutoMod analisou mensagens e filtrou ${autoMod.getFilteredCount()} conteúdos maliciosos.`);
  console.log();
  await sleep(2000);

  // -------------------------------------------------------------------------
  // 5. CENÁRIO DE MODERAÇÃO 2: DETECÇÃO DE DIREITOS AUTORAIS / DMCA
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 5] Cenário DMCA Copyright: Streamer toca música comercial protegida...\x1b[0m');
  console.log('-'.repeat(85));
  await twitchChannel.flagCopyrightDMCA('Eminem - Lose Yourself (Official Audio Release)', 0.98);
  console.log('-'.repeat(85));
  console.log(`📊 Novo Status do Canal: \x1b[33m${twitchChannel.getStatus()}\x1b[0m | Strikes: ${twitchChannel.getMetadata().strikeCount} | Áudio Mutado: ${twitchChannel.getMetadata().isAudioMuted}`);
  console.log();
  await sleep(2000);

  // -------------------------------------------------------------------------
  // 6. CENÁRIO DE MODERAÇÃO 3: DETECÇÃO VISUAL DE GORE / NUDEZ & CONTENT WARNING
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 6] Cenário Safety Vision: Detecção de Conteúdo Sensível (Gore / Nudez)...\x1b[0m');
  console.log('   (Simulação no canal brasileiro "eskimozin" na Kick.com)');
  console.log('-'.repeat(85));
  await kickChannel.goLive('REAGINDO AOS VÍDEOS MAIS BIZARROS DA INTERNET!', 'Just Chatting', ['irl', 'brasil'], 22000);
  await sleep(1000);
  
  // IA de visão detecta cena com violência gráfica / gore em um vídeo reagido
  await kickChannel.flagContentSafetyViolation(
    'GORE', 
    0.96, 
    'Frame #44920: Detecção de ferimento exposto e sangue excessivo',
    'CRITICAL'
  );
  console.log('-'.repeat(85));
  console.log(`📊 Status da Kick: \x1b[31m${kickChannel.getStatus()}\x1b[0m | Content Warning Ativo: ${kickChannel.getMetadata().hasContentWarning}`);
  console.log();
  await sleep(2000);

  // -------------------------------------------------------------------------
  // 7. CENÁRIO DE MODERAÇÃO 4: AÇÃO DE MODERADORES HUMANOS (MODVIEW)
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 7] Cenário ModView: Moderador Humano audita incidentes e aplica punição...\x1b[0m');
  console.log('-'.repeat(85));
  await twitchChannel.executeModeratorAction('guardian_mod_unb', 'BAN PERMANENTE no usuário "spammer_bot" por link de phishing');
  await kickChannel.executeModeratorAction('guardian_mod_unb', 'TIMEOUT 24H no streamer por reincidência de gore em live sem aviso prévio');
  console.log('-'.repeat(85));
  console.log();
  await sleep(1500);

  // -------------------------------------------------------------------------
  // 8. CENÁRIO YOUTUBE: SORASHINA SOPIA ENTRA AO VIVO E ENCERRAMENTO
  // -------------------------------------------------------------------------
  console.log('\x1b[33m[Etapa 8] YouTube Live: Sorashina Sopia entra ao vivo e encerra transmissão...\x1b[0m');
  console.log('-'.repeat(85));
  await ytChannel.goLive(
    '【ELDEN RING】初めてのソウルライク挑戦！クリアまで耐久配信【VTuber】', 
    'Elden Ring', 
    ['vtuber', 'eldenring', 'japan'], 
    32000
  );
  await sleep(1000);
  await ytChannel.endLive();
  await twitchChannel.endLive();
  await kickChannel.endLive();
  console.log('-'.repeat(85));

  console.log('='.repeat(85));
  console.log('\x1b[32m✔ Demonstração Completa de Padrões GoF com Pipeline de Moderação finalizada com sucesso!\x1b[0m');
  console.log('='.repeat(85));
}

runComprehensiveStreamingAndModerationDemo().catch(console.error);
