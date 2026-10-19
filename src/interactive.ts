import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
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
import { IObserver } from './patterns/observer/interfaces.js';

// Estilos e Cores ANSI
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function printBanner() {
  console.clear();
  console.log(c.cyan + c.bold + '╔════════════════════════════════════════════════════════════════════════════════════╗' + c.reset);
  console.log(c.cyan + c.bold + '║  ' + c.magenta + 'STREAM SENTRY' + c.white + ' — Console Interativo do Padrão GoF Observer (SubEquipe 03)        ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + c.bold + '║  ' + c.dim + 'Domínio: Moderação Reativa em Tempo Real para Streaming UGC (Twitch / YouTube)  ' + c.cyan + '║' + c.reset);
  console.log(c.cyan + c.bold + '╚════════════════════════════════════════════════════════════════════════════════════╝' + c.reset);
  console.log();
  console.log(`${c.yellow}💡 Digite ${c.bold}'help'${c.reset}${c.yellow} para ver a lista de comandos ou ${c.bold}'status'${c.reset}${c.yellow} para inspecionar o estado do Subject.${c.reset}`);
  console.log();
}

function printHelp() {
  console.log();
  console.log(`${c.bold}${c.magenta}--- COMANDOS DISPONÍVEIS NO REPL ---${c.reset}`);
  console.log(`  ${c.green}golive [titulo]${c.reset}        - Inicia a transmissão ao vivo (notifica observadores via Push)`);
  console.log(`  ${c.green}chat <mensagem>${c.reset}        - Envia mensagem e aciona AutoMod (Entropia de Shannon / Toxicidade)`);
  console.log(`  ${c.green}nsfw${c.reset}                   - Simula frame com nudez (Safety Vision aciona Content Warning 18+)`);
  console.log(`  ${c.green}gore${c.reset}                   - Simula frame com violência extrema (Safety Vision derruba a live)`);
  console.log(`  ${c.green}dmca [musica]${c.reset}          - Simula detecção de fonograma protegido e silencia a faixa de áudio`);
  console.log(`  ${c.green}piracy${c.reset}                 - Simula detecção de retransmissão de Pay-Per-View via dHash 64-bit`);
  console.log(`  ${c.green}raid${c.reset}                   - Simula invasão coordenada de bots e ativa o Shield Mode`);
  console.log(`  ${c.green}ban <usuario>${c.reset}          - Executa intervenção manual de moderador no ModView`);
  console.log(`  ${c.green}category <nome>${c.reset}        - Altera a categoria/jogo da live via updateMetadata`);
  console.log(`  ${c.green}title <novo_titulo>${c.reset}    - Altera o título da live`);
  console.log(`  ${c.cyan}status${c.reset}                 - Chama ${c.bold}getState()${c.reset} do GoF Observer e exibe o estado atual`);
  console.log(`  ${c.cyan}strategy <sync|async>${c.reset}  - Chaveia dinamicamente o GoF Strategy (Linear vs Worker Pool)`);
  console.log(`  ${c.cyan}observers${c.reset}              - Lista os observadores anexados (IObserver)`);
  console.log(`  ${c.cyan}detach <id>${c.reset}            - Remove um observador do canal (${c.bold}detach${c.reset})`);
  console.log(`  ${c.cyan}attach <tipo>${c.reset}          - Registra um observador (${c.bold}attach${c.reset}: automod, safety, dmca, modview)`);
  console.log(`  ${c.yellow}endlive${c.reset}                - Encerra a live`);
  console.log(`  ${c.dim}clear${c.reset}                  - Limpa a tela do console`);
  console.log(`  ${c.dim}exit${c.reset}                   - Encerra o console interativo`);
  console.log();
}

async function main() {
  const channel = new StreamChannel(
    'canal_eduardo_unb',
    'Eduardo Lôbo [UnB Gaming]',
    'TWITCH',
    'Software Architecture & Gaming'
  );

  // Instancia observadores de moderação e notificações com parâmetros completos
  const autoMod = new AutoModObserver('obs-automod', 'AutoMod Shannon Filter');
  const safetyVision = new SafetyVisionModerationObserver('obs-safety', 'Safety Vision AI (YCbCr/Sobel)');
  const dmcaAudio = new CopyrightDMCAAudioObserver('obs-dmca', 'DMCA Content ID Audio');
  const modView = new HumanModeratorDashboardObserver('obs-modview', 'ModView Admin Dashboard');
  const pushNotif = new PushNotificationObserver('obs-push', 'Mobile Push FCM');
  const discordWebhook = new DiscordWebhookObserver(
    'obs-discord', 
    'Discord Announcement Bot', 
    'Comunidade UnB FGA', 
    'https://discord.com/api/webhooks/unb-fga',
    0
  );
  const chatRaidShield = new ChatRaidShieldObserver('obs-shield', 'Chat Raid Shield Bot Detector');
  const piracyDetector = new PiracyVideoRestreamObserver('obs-piracy', 'Video Piracy dHash Detector');

  // Registra no Subject
  channel.attach(autoMod);
  channel.attach(safetyVision);
  channel.attach(dmcaAudio);
  channel.attach(modView);
  channel.attach(pushNotif);
  channel.attach(discordWebhook);
  channel.attach(chatRaidShield);
  channel.attach(piracyDetector);

  printBanner();

  const rl = readline.createInterface({ input, output });

  try {
    let running = true;
    while (running) {
      const state = channel.getState();
      const statusColor = state.status === 'LIVE' ? c.green : state.status.includes('TERMINATED') ? c.red : state.status.includes('WARNING') ? c.yellow : c.dim;
      const promptText = `${c.cyan}StreamChannel${c.reset} [${statusColor}${c.bold}${state.status}${c.reset}] ❯ `;

      let answer: string;
      try {
        answer = await rl.question(promptText);
      } catch (err: any) {
        break;
      }

      if (answer === undefined || answer === null) break;
      const trimmed = answer.trim();
      if (!trimmed) continue;

      const [command, ...args] = trimmed.split(' ');
      const argString = args.join(' ');

      switch (command.toLowerCase()) {
        case 'help':
        case '?':
          printHelp();
          break;

        case 'clear':
          printBanner();
          break;

        case 'status': {
          const s = channel.getState();
          console.log();
          console.log(`${c.bold}${c.cyan}=== ESTADO DO CONCRETE SUBJECT (getState()) ===${c.reset}`);
          console.log(`  Canal: ${c.bold}${channel.streamerName}${c.reset} (@${channel.channelId}) [${channel.platform}]`);
          console.log(`  Status da Transmissão: ${statusColor}${c.bold}${s.status}${c.reset}`);
          console.log(`  Título: "${s.metadata.title}"`);
          console.log(`  Categoria: ${s.metadata.category}`);
          console.log(`  Espectadores: ${s.metadata.viewerCount}`);
          console.log(`  Estratégia de Despacho (GoF Strategy): ${c.magenta}${channel.getDispatchStrategyName()}${c.reset}`);
          console.log(`  Aviso 18+ (Content Warning): ${s.metadata.hasContentWarning ? c.red + 'SIM (Ativo)' : c.green + 'NÃO'}${c.reset}`);
          console.log(`  Áudio Mutado por DMCA: ${s.metadata.isAudioMuted ? c.red + 'SIM (Mutado)' : c.green + 'NÃO'}${c.reset}`);
          console.log(`  Contagem de Strikes: ${s.metadata.strikeCount > 0 ? c.red + s.metadata.strikeCount : c.green + '0'}${c.reset}`);
          console.log(`  Observadores Anexados (IObserver): ${c.yellow}${s.activeObserversCount}${c.reset}`);
          console.log();
          break;
        }

        case 'golive': {
          const title = argString || 'Desenvolvendo GoF Observer ao Vivo na Twitch';
          console.log(`\n${c.yellow}⚡ Abrindo transmissão e notificando observadores...${c.reset}`);
          const report = await channel.goLive(title, 'Software Engineering', ['unb', 'design-patterns', 'gof'], 150);
          const duration = (report.totalDeliveryDurationMs ?? report.dispatchDurationMs ?? 0).toFixed(2);
          console.log(`${c.green}✅ Live iniciada com sucesso! (${report.totalObservers} observadores notificados em ${duration}ms)${c.reset}\n`);
          break;
        }

        case 'chat': {
          if (!argString) {
            console.log(`${c.red}❌ Informe uma mensagem. Exemplo: chat use this aimbot hack now${c.reset}\n`);
            break;
          }
          console.log(`\n${c.dim}[Chat] Usuário enviou: "${argString}"${c.reset}`);
          await channel.processChatMessage('espectador_chat', argString);
          console.log();
          break;
        }

        case 'nsfw': {
          console.log(`\n${c.yellow}⚠️ Injetando frame de teste com densidade dérmica YCbCr 64%...${c.reset}`);
          await channel.flagContentSafetyViolation(
            'NUDITY_NSFW',
            0.96,
            'Frame PPM 1080p: Densidade Dérmica 64.0% em espaço de cor YCbCr',
            'CRITICAL'
          );
          console.log(`${c.red}🚨 Observadores notificados: Content Warning 18+ ativado no canal!${c.reset}\n`);
          break;
        }

        case 'gore': {
          console.log(`\n${c.red}🛑 Injetando frame de teste com cromatismo de sangue 36% e bordas Sobel 67.0...${c.reset}`);
          await channel.flagContentSafetyViolation(
            'GORE',
            0.99,
            'Frame PPM 1080p: Densidade arterial de sangue 36.0% (Sobel: 67.03)',
            'TERMINAL'
          );
          console.log(`${c.red}⛔ Observadores notificados: Transmissão compulsóriamente encerrada por violação grave de segurança!${c.reset}\n`);
          break;
        }

        case 'dmca': {
          const song = argString || 'Lose Yourself - Eminem (Universal Music)';
          console.log(`\n${c.yellow}🎵 Simulando detecção de fonograma protegido por direitos autorais...${c.reset}`);
          await channel.flagCopyrightDMCA(song, 0.98);
          console.log(`${c.yellow}🔇 Observadores notificados: Faixa de áudio silenciada e strike emitido.${c.reset}\n`);
          break;
        }

        case 'piracy': {
          console.log(`\n${c.yellow}🛑 Simulando comparação dHash 64-bit contra transmissão oficial de Pay-Per-View...${c.reset}`);
          await channel.flagVideoPiracyViolation('ff808080808080fe', 0.984);
          console.log(`${c.red}🚨 Observadores notificados: Takedown judicial emitido e feed de vídeo cortado.${c.reset}\n`);
          break;
        }

        case 'raid': {
          console.log(`\n${c.yellow}🛡️ Injetando rajada coordenada de mensagens de bots...${c.reset}`);
          for (let i = 0; i < 5; i++) {
            await channel.processChatMessage(`bot_${i}`, 'BUY CHEAP FOLLOWERS ON BESTSTREAMS.ONLINE DISCOUNT 50%');
          }
          console.log(`${c.green}✅ Ataque processado pelo ChatRaidShieldObserver.${c.reset}\n`);
          break;
        }

        case 'ban': {
          const target = argString || 'spammer_inconveniente';
          console.log(`\n${c.yellow}👮 Executando intervenção manual no ModView contra ${target}...${c.reset}`);
          await channel.executeModeratorAction('mod_eduardo_unb', `BAN_PERMANENT_USER: ${target}`);
          console.log(`${c.green}🔨 Usuário banido e registrado no log de auditoria dos observadores.${c.reset}\n`);
          break;
        }

        case 'category': {
          if (!argString) {
            console.log(`${c.red}❌ Informe o nome da categoria. Ex: category Counter-Strike 2${c.reset}\n`);
            break;
          }
          await channel.updateMetadata(argString);
          console.log(`${c.green}✅ Categoria atualizada para "${argString}" e observadores notificados.${c.reset}\n`);
          break;
        }

        case 'title': {
          if (!argString) {
            console.log(`${c.red}❌ Informe o novo título. Ex: title Nova Live de Testes${c.reset}\n`);
            break;
          }
          await channel.updateMetadata(undefined, argString);
          console.log(`${c.green}✅ Título atualizado para "${argString}" e observadores notificados.${c.reset}\n`);
          break;
        }

        case 'strategy': {
          const type = args[0]?.toLowerCase();
          if (type === 'sync') {
            channel.setDispatchStrategy(new SynchronousBlockingDispatchStrategy());
            console.log(`${c.yellow}🔄 GoF Strategy alterado para: SynchronousBlockingDispatchStrategy (Loop for clássico).${c.reset}\n`);
          } else if (type === 'async') {
            channel.setDispatchStrategy(new AsynchronousConcurrentDispatchStrategy(150));
            console.log(`${c.green}🔄 GoF Strategy alterado para: AsynchronousConcurrentDispatchStrategy (Worker Pool Concorrente).${c.reset}\n`);
          } else {
            console.log(`${c.red}❌ Use 'strategy sync' ou 'strategy async'.${c.reset}\n`);
          }
          break;
        }

        case 'observers': {
          console.log(`\n${c.cyan}${c.bold}=== OBSERVADORES ANEXADOS AO SUBJECT (IObserver) ===${c.reset}`);
          console.log(`  Total: ${c.yellow}${channel.getObserversCount()}${c.reset} observadores registrados.`);
          console.log(`  - obs-automod: AutoMod Shannon Filter (Chat)`);
          console.log(`  - obs-safety: Safety Vision AI (Nudez / Gore)`);
          console.log(`  - obs-dmca: DMCA Audio Content ID (Áudio)`);
          console.log(`  - obs-modview: ModView Admin Dashboard (Humano)`);
          console.log(`  - obs-push: Push Notification (Mobile)`);
          console.log(`  - obs-discord: Discord Bot Webhook`);
          console.log(`  - obs-shield: Chat Raid Shield AI`);
          console.log(`  - obs-piracy: Video Piracy dHash Detector`);
          console.log();
          break;
        }

        case 'detach': {
          const id = args[0];
          if (!id) {
            console.log(`${c.red}❌ Informe o ID do observador. Ex: detach obs-automod${c.reset}\n`);
            break;
          }
          const removed = channel.detach(id);
          if (removed) {
            console.log(`${c.green}✅ Observador '${id}' desanexado com sucesso (detach).${c.reset}\n`);
          } else {
            console.log(`${c.yellow}⚠️ Observador '${id}' não estava registrado.${c.reset}\n`);
          }
          break;
        }

        case 'attach': {
          const type = args[0]?.toLowerCase();
          let obs: IObserver | null = null;
          if (type === 'automod') obs = autoMod;
          else if (type === 'safety') obs = safetyVision;
          else if (type === 'dmca') obs = dmcaAudio;
          else if (type === 'modview') obs = modView;
          else if (type === 'push') obs = pushNotif;
          else if (type === 'discord') obs = discordWebhook;
          else if (type === 'shield') obs = chatRaidShield;
          else if (type === 'piracy') obs = piracyDetector;

          if (obs) {
            channel.attach(obs);
            console.log(`${c.green}✅ Observador '${obs.id}' reanexado com sucesso (attach).${c.reset}\n`);
          } else {
            console.log(`${c.red}❌ Tipo desconhecido. Opções: automod, safety, dmca, modview, push, discord, shield, piracy.${c.reset}\n`);
          }
          break;
        }

        case 'endlive': {
          console.log(`\n${c.yellow}🛑 Encerrando transmissão...${c.reset}`);
          await channel.endLive();
          console.log(`${c.green}✅ Live encerrada e observadores notificados.${c.reset}\n`);
          break;
        }

        case 'exit':
        case 'quit':
          console.log(`\n${c.cyan}👋 Encerrando console interativo. Até logo!${c.reset}\n`);
          running = false;
          break;

        default:
          console.log(`${c.red}❌ Comando desconhecido: "${command}". Digite 'help' para ver as opções.${c.reset}\n`);
          break;
      }
    }
  } finally {
    rl.close();
  }
}

main().catch(console.error);
