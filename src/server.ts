import { StreamServer } from './engine/server/StreamServer.js';

const PORT = 3333;
const server = new StreamServer(PORT);

server.start().then(() => {
  console.log(`\x1b[1m\x1b[35m========================================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m  STREAMSENTRY - SERVIDOR REAL DE MODERAÇÃO E STREAMING (GOF OBSERVER)\x1b[0m`);
  console.log(`  Abra no seu navegador: \x1b[4mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  Rotas da API:`);
  console.log(`    - POST /api/stream/start`);
  console.log(`    - POST /api/chat/send { sender, message }`);
  console.log(`    - POST /api/moderation/safety { flagType: "GORE" | "NUDITY_NSFW" }`);
  console.log(`    - POST /api/moderation/dmca { track: string }`);
  console.log(`\x1b[1m\x1b[35m========================================================================\x1b[0m`);
});

process.on('SIGINT', async () => {
  console.log('\nEncerrando servidor...');
  await server.stop();
  process.exit(0);
});
