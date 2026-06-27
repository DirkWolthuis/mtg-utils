import { execSync } from 'child_process';
import { startWebSocketServer } from './server/ws-server';

const port = Number(process.env['PORT'] ?? 8080);

let version = 'dev';
try {
  version = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // not a git repo or git not available — keep 'dev'
}

startWebSocketServer({ port, version });
console.log(`engine-server listening on ws://localhost:${port} (${version})`);
