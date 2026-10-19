import { StreamChannel } from './patterns/observer/StreamChannel.js';
import { YouTubeWebSubFCMObserver } from './patterns/observer/observers/YouTubeWebSubFCMObserver.js';
import { KickPusherChannelObserver } from './patterns/observer/observers/KickPusherChannelObserver.js';
import { TwitchEventSubObserver } from './patterns/observer/observers/TwitchEventSubObserver.js';
import { DiscordCrossPlatformWebhookObserver } from './patterns/observer/observers/DiscordCrossPlatformWebhookObserver.js';
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
async function runMultiPlatformLiveDemo() {
    console.clear();
    console.log('='.repeat(80));
    console.log('\x1b[1m\x1b[36m  PLATAFORMA MULTIPLATAFORMA UGC - SUBEQUIPE 03 (OBSERVER PATTERN)\x1b[0m');
    console.log('  Embasamento Técnico Real: YouTube Live (WebSub), Kick.com (Pusher) e Twitch (EventSub)');
    console.log('='.repeat(80));
    console.log();
    // 1. Instanciando canais em diferentes gigantes de UGC
    console.log('\x1b[33m[Etapa 1] Inicializando Canais em Diferentes Plataformas UGC (Concrete Subjects)...\x1b[0m');
    const ytChannel = new StreamChannel('cazetv', 'Casimiro Miguel (CazéTV)', 'YOUTUBE_LIVE', 'Futebol / Esportes');
    const kickChannel = new StreamChannel('coringa', 'Victor Augusto (Coringa)', 'KICK', 'GTA RP / V-Log');
    const twitchChannel = new StreamChannel('gaules', 'Alexandre Borba (Gaules)', 'TWITCH', 'Counter-Strike 2');
    console.log(`✅ Canal 1: "${ytChannel.streamerName}" [${ytChannel.platform}] -> ${ytChannel.getMetadata().streamUrl}`);
    console.log(`✅ Canal 2: "${kickChannel.streamerName}" [${kickChannel.platform}] -> ${kickChannel.getMetadata().streamUrl}`);
    console.log(`✅ Canal 3: "${twitchChannel.streamerName}" [${twitchChannel.platform}] -> ${twitchChannel.getMetadata().streamUrl}`);
    console.log();
    await sleep(1500);
    // 2. Registrando Observadores Reais
    console.log('\x1b[33m[Etapa 2] Registrando Observadores Especializados de Cada Infraestrutura...\x1b[0m');
    // Observador YouTube: Google WebSub + FCM Push
    const ytObserver = new YouTubeWebSubFCMObserver('obs-yt-01', 'YouTube WebSub Hub', 'UC_cazetv_123', 20);
    ytChannel.attach(ytObserver);
    // Observador Kick: Pusher Channels WebSockets
    const kickObserver = new KickPusherChannelObserver('obs-kick-01', 'Kick Pusher Edge Gateway', 'coringa', 15);
    kickChannel.attach(kickObserver);
    // Observador Twitch: EventSub
    const twitchObserver = new TwitchEventSubObserver('obs-twitch-01', 'Twitch EventSub Edge', 18);
    twitchChannel.attach(twitchObserver);
    // Observador Transversal: Bot Discord Multiplataforma
    const discordBot = new DiscordCrossPlatformWebhookObserver('obs-discord-bot', 'Discord Community Alerts', 'Tribo & Cazé Server', 'https://discord.com/api/webhooks/live-hub', 25);
    ytChannel.attach(discordBot);
    kickChannel.attach(discordBot);
    twitchChannel.attach(discordBot);
    console.log(`✅ Observadores registrados com sucesso em todos os canais.`);
    console.log();
    await sleep(1500);
    // 3. CazéTV entra ao vivo no YouTube Live
    console.log('\x1b[33m[Etapa 3] CazéTV entra ao vivo no YOUTUBE LIVE (Disparo WebSub + FCM)...\x1b[0m');
    console.log('-'.repeat(80));
    const ytReport = await ytChannel.goLive('VASCO DA GAMA X FLAMENGO - SEMIFINAL AO VIVO COM IMAGENS!', 'Futebol', ['futebol', 'brasileirao', 'cazetv'], 250000);
    console.log('-'.repeat(80));
    console.log(`📊 Relatório YouTube: ${ytReport.successful}/${ytReport.totalObservers} entregues em ${ytReport.totalDeliveryDurationMs.toFixed(2)} ms.`);
    console.log();
    await sleep(2000);
    // 4. Coringa entra ao vivo na KICK
    console.log('\x1b[33m[Etapa 4] Coringa entra ao vivo na KICK.COM (Broadcast Pusher WebSocket)...\x1b[0m');
    console.log('-'.repeat(80));
    const kickReport = await kickChannel.goLive('NOVO EVENTO DE GTA RP NA CIDADE ALTA + SORTEIO!', 'Grand Theft Auto V', ['gtarp', 'loud', 'kick'], 45000);
    console.log('-'.repeat(80));
    console.log(`📊 Relatório Kick: ${kickReport.successful}/${kickReport.totalObservers} entregues em ${kickReport.totalDeliveryDurationMs.toFixed(2)} ms.`);
    console.log();
    await sleep(2000);
    // 5. Gaules entra ao vivo na TWITCH
    console.log('\x1b[33m[Etapa 5] Gaules entra ao vivo na TWITCH (Disparo EventSub)...\x1b[0m');
    console.log('-'.repeat(80));
    const twitchReport = await twitchChannel.goLive('MAJOR CS2 - FASE DE GRUPOS - FURIA NA MESA!', 'Counter-Strike 2', ['major', 'tribo', 'furia'], 110000);
    console.log('-'.repeat(80));
    console.log(`📊 Relatório Twitch: ${twitchReport.successful}/${twitchReport.totalObservers} entregues em ${twitchReport.totalDeliveryDurationMs.toFixed(2)} ms.`);
    console.log();
    await sleep(2000);
    // 6. Atualização dinâmica e encerramento
    console.log('\x1b[33m[Etapa 6] Atualização Dinâmica e Encerramento (Ciclo de Vida do Subject)...\x1b[0m');
    await kickChannel.updateMetadata('Conversa Fiada', 'Abrindo presentes e reagindo a vídeos');
    await sleep(1000);
    await ytChannel.endLive();
    await kickChannel.endLive();
    await twitchChannel.endLive();
    console.log('='.repeat(80));
    console.log('\x1b[32m✔ Demonstração Multiplataforma concluída com embasamento de YouTube Live, Kick e Twitch!\x1b[0m');
    console.log('='.repeat(80));
}
runMultiPlatformLiveDemo().catch(console.error);
