import { StreamChannel } from './patterns/observer/StreamChannel.js';
import { SimulatedFollowerObserver } from './patterns/observer/observers/SimulatedFollowerObserver.js';
import { SynchronousBlockingDispatchStrategy } from './patterns/strategy/SynchronousBlockingDispatchStrategy.js';
import { AsynchronousConcurrentDispatchStrategy } from './patterns/strategy/AsynchronousConcurrentDispatchStrategy.js';

interface BenchmarkRunResult {
  modeName: string;
  totalObservers: number;
  mainThreadBlockingMs: number;
  totalDeliveryDurationMs: number;
  successful: number;
  failed: number;
  throughputPerSecond: number;
}

async function runBenchmark() {
  console.clear();
  console.log('='.repeat(80));
  console.log('\x1b[1m\x1b[35m  TWITCH BENCHMARK: PADRÕES OBSERVER + STRATEGY (CONCORRÊNCIA NA TWITCH)\x1b[0m');
  console.log('  Iniciativa Extra - SubEquipe 03 (Padrões Comportamentais GoF)');
  console.log('  Comparação de Estratégias: Síncrona Clássica vs. Assíncrona Concorrente');
  console.log('='.repeat(80));
  console.log();

  const FOLLOWER_COUNT = 2000;
  const SIMULATED_LATENCY_MS = 5; // 5ms de latência de socket por espectador
  const CONCURRENCY_WORKERS = 150; // Pool de 150 notificações concorrentes

  console.log(`📌 Cenário de Teste de Carga:`);
  console.log(`   - Streamer: "Dima Wallhacks (US)" abrindo transmissão de CS2 na Twitch`);
  console.log(`   - Seguidores Ativos Conectados: ${FOLLOWER_COUNT.toLocaleString()} espectadores`);
  console.log(`   - Latência Média de I/O de Rede por Notificação: ${SIMULATED_LATENCY_MS} ms`);
  console.log(`   - Pool de Concorrência da Estratégia Assíncrona: ${CONCURRENCY_WORKERS} workers paralelos`);
  console.log();

  const channel = new StreamChannel('dima_wallhacks', 'Dima Wallhacks', 'TWITCH', 'Counter-Strike 2');

  console.log(`⏳ Populando ${FOLLOWER_COUNT} observadores na memória da Twitch...`);
  for (let i = 1; i <= FOLLOWER_COUNT; i++) {
    const follower = new SimulatedFollowerObserver(
      `viewer-${i}`,
      `Espectador_${i}`,
      SIMULATED_LATENCY_MS,
      0.002 // 0.2% de falhas simuladas de conexão
    );
    channel.attach(follower);
  }
  console.log('✔ 2.000 observadores registrados no canal.');
  console.log();

  // -------------------------------------------------------------
  // Teste 1: Estratégia Síncrona Bloqueante
  // -------------------------------------------------------------
  console.log('\x1b[31m▶ Executando com Estratégia 1: Síncrona Bloqueante (Slide 53 - Naive)...\x1b[0m');
  channel.setDispatchStrategy(new SynchronousBlockingDispatchStrategy());

  const syncStart = performance.now();
  const syncReport = await channel.goLive(
    'MAJOR CS2 - ROAD TO RANK 1 GLOBAL!',
    'Counter-Strike 2',
    ['major', 'fps', 'cs2'],
    120000
  );
  const syncTotalTime = performance.now() - syncStart;

  const syncResult: BenchmarkRunResult = {
    modeName: 'Strategy: Síncrono Tradicional',
    totalObservers: FOLLOWER_COUNT,
    mainThreadBlockingMs: syncReport.dispatchDurationMs,
    totalDeliveryDurationMs: syncTotalTime,
    successful: syncReport.successful,
    failed: syncReport.failed,
    throughputPerSecond: (FOLLOWER_COUNT / (syncTotalTime / 1000))
  };

  console.log(`  ✔ Concluído em ${syncTotalTime.toFixed(2)} ms`);
  console.log();

  // -------------------------------------------------------------
  // Teste 2: Estratégia Assíncrona com Concorrência
  // -------------------------------------------------------------
  console.log('\x1b[32m▶ Executando com Estratégia 2: Assíncrona Concorrente (Iniciativa Extra)...\x1b[0m');
  channel.setDispatchStrategy(new AsynchronousConcurrentDispatchStrategy(CONCURRENCY_WORKERS));

  const asyncStart = performance.now();
  const asyncReport = await channel.goLive(
    'MAJOR CS2 - ROAD TO RANK 1 GLOBAL!',
    'Counter-Strike 2',
    ['major', 'fps', 'cs2'],
    120000
  );
  const asyncTotalTime = performance.now() - asyncStart;

  const asyncResult: BenchmarkRunResult = {
    modeName: 'Strategy: Assíncrono Otimizado',
    totalObservers: FOLLOWER_COUNT,
    mainThreadBlockingMs: asyncReport.dispatchDurationMs,
    totalDeliveryDurationMs: asyncTotalTime,
    successful: asyncReport.successful,
    failed: asyncReport.failed,
    throughputPerSecond: (FOLLOWER_COUNT / (asyncTotalTime / 1000))
  };

  console.log(`  ✔ Concluído em ${asyncTotalTime.toFixed(2)} ms`);
  console.log();

  // -------------------------------------------------------------
  // Tabela Comparativa de Desempenho
  // -------------------------------------------------------------
  const speedupTotal = syncResult.totalDeliveryDurationMs / asyncResult.totalDeliveryDurationMs;
  const speedupThread = syncResult.mainThreadBlockingMs / asyncResult.mainThreadBlockingMs;

  console.log('='.repeat(80));
  console.log('\x1b[1m\x1b[33m                       TABELA COMPARATIVA DE DESEMPENHO                       \x1b[0m');
  console.log('='.repeat(80));
  console.table([
    {
      'Estratégia Adotada': syncResult.modeName,
      'Espectadores': syncResult.totalObservers,
      'Bloqueio Thread (ms)': syncResult.mainThreadBlockingMs.toFixed(2),
      'Tempo Total (ms)': syncResult.totalDeliveryDurationMs.toFixed(2),
      'Throughput (notif/s)': syncResult.throughputPerSecond.toFixed(1),
      'Entregues': `${syncResult.successful}/${syncResult.totalObservers}`,
      'Falhas Isoladas': syncResult.failed
    },
    {
      'Estratégia Adotada': asyncResult.modeName,
      'Espectadores': asyncResult.totalObservers,
      'Bloqueio Thread (ms)': asyncResult.mainThreadBlockingMs.toFixed(2),
      'Tempo Total (ms)': asyncResult.totalDeliveryDurationMs.toFixed(2),
      'Throughput (notif/s)': asyncResult.throughputPerSecond.toFixed(1),
      'Entregues': `${asyncResult.successful}/${asyncResult.totalObservers}`,
      'Falhas Isoladas': asyncResult.failed
    }
  ]);

  console.log('\x1b[1m\x1b[32m📌 CONCLUSÕES DE ENGENHARIA DE SOFTWARE:\x1b[0m');
  console.log(` 1. Speedup Total de Entrega: A estratégia assíncrona foi \x1b[32m${speedupTotal.toFixed(1)}x mais rápida\x1b[0m.`);
  console.log(` 2. Liberação da Thread Principal: A interface do streamer foi liberada \x1b[32m${speedupThread.toFixed(1)}x mais rápido\x1b[0m.`);
  console.log(` 3. Isolamento de Falhas: Falhas individuais em sockets móveis (${asyncResult.failed}) foram contidas.`);
  console.log('='.repeat(80));
}

runBenchmark().catch(console.error);
