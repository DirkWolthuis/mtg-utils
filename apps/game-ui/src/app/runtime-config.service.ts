import { Injectable, signal } from '@angular/core';

export type RuntimeConfig = {
  engineWsUrl: string;
};

const DEFAULT_ENGINE_WS_URL = 'ws://localhost:8080';

/**
 * Loads `/config.json` at app startup so the engine WebSocket URL can be set per
 * deployment (production, Netlify Deploy Preview) without rebuilding the bundle.
 * Netlify writes the file during its build; locally the committed default points
 * at `ws://localhost:8080`.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly engineWsUrl = signal(DEFAULT_ENGINE_WS_URL);

  async load(): Promise<void> {
    try {
      const res = await fetch('config.json', { cache: 'no-cache' });
      if (!res.ok) {
        return;
      }
      const config = (await res.json()) as Partial<RuntimeConfig>;
      if (config.engineWsUrl) {
        this.engineWsUrl.set(config.engineWsUrl);
      }
    } catch {
      // Keep the default URL if the config file is missing or malformed.
    }
  }
}
