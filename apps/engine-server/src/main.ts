import { BUILD_HASH } from './build-hash';
import { startWebSocketServer } from './server/ws-server';

const port = Number(process.env['PORT'] ?? 8080);
startWebSocketServer({ port, version: BUILD_HASH });
console.log(`engine-server listening on ws://localhost:${port} (${BUILD_HASH})`);
