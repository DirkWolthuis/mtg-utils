import { startWebSocketServer } from './server/ws-server';

const port = Number(process.env['PORT'] ?? 8080);
startWebSocketServer({ port });
console.log(`engine-server listening on ws://localhost:${port}`);
