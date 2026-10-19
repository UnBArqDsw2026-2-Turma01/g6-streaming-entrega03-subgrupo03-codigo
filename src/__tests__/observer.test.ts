import { ChatRaidShieldObserver } from '../patterns/observer/observers/ChatRaidShieldObserver.js';
import { PiracyVideoRestreamObserver } from '../patterns/observer/observers/PiracyVideoRestreamObserver.js';
import { VideoPerceptualHasher } from '../engine/algorithms/VideoPerceptualHasher.js';
import { ChatRaidVelocityFilter } from '../engine/algorithms/ChatRaidVelocityFilter.js';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { StreamChannel } from '../patterns/observer/StreamChannel.js';
import { AutoModObserver } from '../patterns/observer/observers/AutoModObserver.js';
import { SafetyVisionModerationObserver } from '../patterns/observer/observers/SafetyVisionModerationObserver.js';
import { CopyrightDMCAAudioObserver } from '../patterns/observer/observers/CopyrightDMCAAudioObserver.js';
import { HumanModeratorDashboardObserver } from '../patterns/observer/observers/HumanModeratorDashboardObserver.js';
import { DiscordWebhookObserver } from '../patterns/observer/observers/DiscordWebhookObserver.js';
import { PushNotificationObserver } from '../patterns/observer/observers/PushNotificationObserver.js';
import { SynchronousBlockingDispatchStrategy } from '../patterns/strategy/SynchronousBlockingDispatchStrategy.js';
import { AsynchronousConcurrentDispatchStrategy } from '../patterns/strategy/AsynchronousConcurrentDispatchStrategy.js';
import { TextEntropyAnalyzer } from '../engine/algorithms/TextEntropyAnalyzer.js';
import { ComputerVisionFilter } from '../engine/algorithms/ComputerVisionFilter.js';
import { AcousticFingerprinter } from '../engine/algorithms/AcousticFingerprinter.js';

describe('Padrão GoF Observer com Moderação Reativa Completa - SubEquipe 03', () => {

  it('deve registrar (attach), desanexar (detach) observadores e inspecionar estado (getState)', () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const autoMod = new AutoModObserver('obs-auto', 'AutoMod');
    const dmca = new CopyrightDMCAAudioObserver('obs-dmca', 'DMCA');

    assert.strictEqual(channel.getObserversCount(), 0);
    channel.attach(autoMod);
    channel.attach(dmca);
    assert.strictEqual(channel.getObserversCount(), 2);

    const state = channel.getState();
    assert.strictEqual(state.status, 'OFFLINE');
    assert.strictEqual(state.activeObserversCount, 2);
    assert.strictEqual(state.metadata.channelId, 'dima_wallhacks');

    const detached = channel.detach('obs-auto');
    assert.strictEqual(detached, true);
    assert.strictEqual(channel.getObserversCount(), 1);
  });

  it('deve disparar eventos de ciclo de vida (goLive, updateMetadata, endStream) nos canais reais', async () => {
    // Canal 1: YouTube Live - SorashinaSopia
    const ytChannel = new StreamChannel('SorashinaSopia', 'Sorashina Sopia [VTuber]', 'YOUTUBE_LIVE');
    const discord = new DiscordWebhookObserver('obs-discord', 'Discord Bot', 'VTuber Hub', 'https://discord.com/hook');
    ytChannel.attach(discord);

    const liveReport = await ytChannel.goLive('Elden Ring DLC Live', 'Gaming', ['vtuber', 'jrpg'], 1500);
    assert.strictEqual(ytChannel.getStatus(), 'LIVE');
    assert.strictEqual(ytChannel.getMetadata().viewerCount, 1500);
    assert.strictEqual(liveReport.totalObservers, 1);
    assert.strictEqual(liveReport.successful, 1);

    await ytChannel.updateMetadata('Souls-like Gaming', 'Elden Ring Boss Rush');
    assert.strictEqual(ytChannel.getMetadata().category, 'Souls-like Gaming');
    assert.strictEqual(ytChannel.getMetadata().title, 'Elden Ring Boss Rush');

    await ytChannel.endLive();
    assert.strictEqual(ytChannel.getStatus(), 'OFFLINE');
  });

  it('AutoMod: deve analisar matematicamente a Entropia de Shannon e reter spam/toxicidade', async () => {
    const channel = new StreamChannel('eskimozin', 'eskimozin', 'KICK');
    const autoMod = new AutoModObserver('obs-automod', 'AutoMod AI');
    channel.attach(autoMod);

    // 1. Mensagem repetitiva (baixa entropia)
    const lowEntropyReport = await channel.processChatMessage('troll123', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(lowEntropyReport.successful, 1);

    // 2. Mensagem com termos tóxicos normalizados de leetspeak
    await channel.processChatMessage('cheater', 'use this h@ck and aimbot wallhack now');

    // 3. Phishing link
    await channel.processChatMessage('spambot', 'claim your free-robux.site right now free_bits');

    assert.strictEqual(autoMod.getFilteredCount() >= 2, true);
    const logs = autoMod.getLogs();
    assert.strictEqual(logs.length >= 2, true);
    assert.ok(logs.some(l => l.violations.length > 0));
  });

  it('Safety Vision AI: deve ler imagem PPM real e acionar Content Warning (Gate 18+) para Nudez', async () => {
    const channel = new StreamChannel('SorashinaSopia', 'Sorashina Sopia', 'YOUTUBE_LIVE');
    const safetyVision = new SafetyVisionModerationObserver('obs-safety', 'Vision Safety');
    channel.attach(safetyVision);

    const skinPpmPath = path.resolve(process.cwd(), 'test_media/skin_sample.ppm');
    const report = ComputerVisionFilter.analyzePpmFile(skinPpmPath);

    assert.strictEqual(report.isNsfwNudity, true);
    assert.strictEqual(report.skinPixelPercentage >= 35, true);

    await channel.flagContentSafetyViolation('NUDITY_NSFW', report.skinPixelPercentage, skinPpmPath, 'CRITICAL');

    assert.strictEqual(channel.getStatus(), 'CONTENT_WARNING_RESTRICTED');
    assert.strictEqual(channel.getMetadata().hasContentWarning, true);
    assert.strictEqual(safetyVision.getIncidentCount(), 1);
    assert.strictEqual(safetyVision.getLastReport()?.isNsfwNudity, true);
  });

  it('Safety Vision AI: deve detectar densidade arterial de sangue (Gore) e encerrar transmissão (TERMINAL)', async () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const safetyVision = new SafetyVisionModerationObserver('obs-safety', 'Vision Safety');
    channel.attach(safetyVision);

    const gorePpmPath = path.resolve(process.cwd(), 'test_media/gore_sample.ppm');
    const report = ComputerVisionFilter.analyzePpmFile(gorePpmPath);

    assert.strictEqual(report.isGoreDetected, true);
    assert.strictEqual(report.gorePixelPercentage >= 15, true);

    await channel.flagContentSafetyViolation('GORE', report.gorePixelPercentage, gorePpmPath, 'TERMINAL');

    assert.strictEqual(channel.getStatus(), 'TERMINATED_SAFETY_VIOLATION');
    assert.strictEqual(channel.getMetadata().strikeCount >= 3, true);
    assert.strictEqual(safetyVision.getIncidentCount(), 1);
  });

  it('DMCA Copyright: deve detectar áudio protegido com Acoustic Fingerprint e silenciar live', async () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const dmca = new CopyrightDMCAAudioObserver('obs-dmca', 'DMCA Detector');
    channel.attach(dmca);

    const match = AcousticFingerprinter.matchAudioSample('Eminem - Lose Yourself (Official Music Audio)');
    assert.strictEqual(match.isMatch, true);
    assert.strictEqual(match.songTitle, 'Lose Yourself');
    assert.strictEqual(match.artist, 'Eminem');

    await channel.flagCopyrightDMCA('Eminem - Lose Yourself (Official Music Audio)', match.confidenceScore);

    assert.strictEqual(channel.getStatus(), 'AUDIO_MUTED_COPYRIGHT');
    assert.strictEqual(channel.getMetadata().isAudioMuted, true);
    assert.strictEqual(channel.getMetadata().strikeCount, 1);
    assert.strictEqual(dmca.getStrikesCount(), 1);
  });

  it('Human ModView: deve registrar ações de moderadores humanos e histórico de auditoria', async () => {
    const channel = new StreamChannel('eskimozin', 'eskimozin', 'KICK');
    const humanMod = new HumanModeratorDashboardObserver('obs-mod', 'ModView Eskimosin', 'mod_adm_brasil');
    channel.attach(humanMod);

    await channel.flagContentSafetyViolation('GORE', 85, 'test_media/gore_sample.ppm', 'CRITICAL');
    await channel.executeModeratorAction('mod_adm_brasil', 'BAN_PERMANENT_USER: spammer99');

    const history = humanMod.getActionsHistory();
    assert.strictEqual(history.length >= 2, true);
  });

  it('GoF Strategy: deve permitir alternar dinamicamente entre despacho Síncrono e Concorrente Assíncrono', async () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const push = new PushNotificationObserver('obs-push', 'Push', 'token-123');
    channel.attach(push);

    // 1. Estratégia Inicial Assíncrona Concorrente
    assert.strictEqual(channel.getDispatchStrategyName().includes('Assíncrono Concorrente'), true);
    const resAsync = await channel.goLive('Major Tournament CS2', 'Counter-Strike 2');
    assert.strictEqual(resAsync.successful, 1);

    // 2. Troca dinâmica de algoritmo para Síncrono Bloqueante
    channel.setDispatchStrategy(new SynchronousBlockingDispatchStrategy());
    assert.strictEqual(channel.getDispatchStrategyName().includes('Síncrono'), true);
    const resSync = await channel.updateMetadata('Counter-Strike 2 Finals');
    assert.strictEqual(resSync.successful, 1);
  });


  it('Chat Raid Shield AI: deve detectar invasão de bots por velocidade e Levenshtein e ativar Shield Mode', async () => {
    const channel = new StreamChannel('eskimozin', 'eskimozin', 'KICK');
    const raidShield = new ChatRaidShieldObserver('obs-raid', 'Raid Shield');
    channel.attach(raidShield);

    // Envia rajada rápida de mensagens similares de bots
    for (let i = 0; i < 9; i++) {
      await channel.processChatMessage('bot_' + i, 'SPAM RAID ATTACK SUBSCRIBE NOW TO FREE BITS');
    }

    assert.strictEqual(raidShield.getShieldModeStatus(), true);
    assert.strictEqual(raidShield.getRaidsBlockedCount(), 1);
    assert.strictEqual(raidShield.getLastReport()?.isRaidDetected, true);
  });

  it('Video Piracy dHash AI: deve comparar assinatura perceptual 64-bit e derrubar retransmissão de Pay-Per-View', async () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const piracyObserver = new PiracyVideoRestreamObserver('obs-piracy', 'Video Piracy dHash');
    channel.attach(piracyObserver);

    // Hash muito próximo ao broadcast oficial do UFC 300 ('ff808080808080ff') com apenas 1 bit de diferença
    const interceptedFrameHash = 'ff808080808080fe';
    const match = VideoPerceptualHasher.matchFrame(interceptedFrameHash);

    assert.strictEqual(match.isPiracyRestreamMatch, true);
    assert.strictEqual(match.matchedBroadcastTitle?.includes('UFC 300'), true);
    assert.strictEqual(match.hammingDistance <= 2, true);

    await channel.flagVideoPiracyViolation(interceptedFrameHash, match.confidenceScore);

    assert.strictEqual(channel.getStatus(), 'TERMINATED_SAFETY_VIOLATION');
    assert.strictEqual(piracyObserver.getPiracyCount(), 1);
  });


  it('Safety Vision AI: deve detectar Hentai / 2D Anime NSFW via cel-shading e line-art em PPM real', async () => {
    const channel = new StreamChannel('SorashinaSopia', 'Sorashina Sopia', 'YOUTUBE_LIVE');
    const safetyVision = new SafetyVisionModerationObserver('obs-safety', 'Vision Safety');
    channel.attach(safetyVision);

    const hentaiPpmPath = path.resolve(process.cwd(), 'test_media/hentai_anime_sample.ppm');
    const report = ComputerVisionFilter.analyzePpmFile(hentaiPpmPath);

    assert.strictEqual(report.isAnimeHentaiDetected, true);
    assert.strictEqual(report.contentClassification, '2D_ANIME_HENTAI_NSFW');
    assert.strictEqual(report.severity, 'CRITICAL');

    await channel.flagContentSafetyViolation('NUDITY_NSFW', report.skinPixelPercentage, hentaiPpmPath, 'CRITICAL');
    assert.strictEqual(channel.getStatus(), 'CONTENT_WARNING_RESTRICTED');
    assert.strictEqual(channel.getMetadata().hasContentWarning, true);
  });

  it('Copyright Video: deve detectar retransmissão de filme da Disney (The Lion King) e emitir takedown', async () => {
    const channel = new StreamChannel('eskimozin', 'eskimozin', 'KICK');
    const piracyObs = new PiracyVideoRestreamObserver('obs-piracy', 'Video Piracy dHash');
    channel.attach(piracyObs);

    const disneyInterceptedHash = 'eecc88000088ccfe'; // 1 bit de diferença da assinatura oficial da Disney
    const match = VideoPerceptualHasher.matchFrame(disneyInterceptedHash);

    assert.strictEqual(match.isPiracyRestreamMatch, true);
    assert.strictEqual(match.matchedBroadcastTitle?.includes('Disney'), true);
    assert.strictEqual(match.confidenceScore >= 0.95, true);

    await channel.flagVideoPiracyViolation(disneyInterceptedHash, match.confidenceScore);
    assert.strictEqual(channel.getStatus(), 'TERMINATED_SAFETY_VIOLATION');
    assert.strictEqual(piracyObs.getPiracyCount(), 1);
  });

  it('DMCA Audio: deve identificar fonograma de Tyler, The Creator (Columbia Records) e mutar áudio', async () => {
    const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH');
    const dmcaObs = new CopyrightDMCAAudioObserver('obs-dmca', 'DMCA');
    channel.attach(dmcaObs);

    const match = AcousticFingerprinter.matchAudioSample('Tyler, The Creator - See You Again ft. Kali Uchis');
    assert.strictEqual(match.isMatch, true);
    assert.strictEqual(match.artist.includes('Tyler, The Creator'), true);
    assert.strictEqual(match.label.includes('Columbia Records'), true);

    await channel.flagCopyrightDMCA('Tyler, The Creator - See You Again', match.confidenceScore);
    assert.strictEqual(channel.getStatus(), 'AUDIO_MUTED_COPYRIGHT');
    assert.strictEqual(channel.getMetadata().isAudioMuted, true);
  });
});
