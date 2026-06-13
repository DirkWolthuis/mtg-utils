import type { ClientMessage } from './client-to-server';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export const isClientMessage = (raw: unknown): raw is ClientMessage => {
  if (!isObject(raw)) return false;
  const kind = raw['kind'];
  if (typeof kind !== 'string') return false;
  switch (kind) {
    case 'join_game':
      return (
        typeof raw['gameId'] === 'string' &&
        typeof raw['playerId'] === 'string' &&
        typeof raw['name'] === 'string' &&
        Array.isArray(raw['deck'])
      );
    case 'submit_action':
      return (
        typeof raw['gameId'] === 'string' &&
        isObject(raw['action']) &&
        typeof (raw['action'] as Record<string, unknown>)['kind'] === 'string'
      );
    case 'leave_game':
      return typeof raw['gameId'] === 'string' && typeof raw['playerId'] === 'string';
    default:
      return false;
  }
};

export const parseClientMessage = (rawText: string): ClientMessage | null => {
  try {
    const json: unknown = JSON.parse(rawText);
    return isClientMessage(json) ? json : null;
  } catch {
    return null;
  }
};
