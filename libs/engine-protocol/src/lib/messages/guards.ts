import type { ClientMessage } from './client-to-server';
import { ClientMessageKind } from './client-to-server';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export const isClientMessage = (raw: unknown): raw is ClientMessage => {
  if (!isObject(raw)) return false;
  const kind = raw['kind'];
  if (typeof kind !== 'string') return false;
  switch (kind) {
    case ClientMessageKind.JoinGame:
      return (
        typeof raw['gameId'] === 'string' &&
        typeof raw['playerId'] === 'string' &&
        typeof raw['name'] === 'string' &&
        Array.isArray(raw['deck'])
      );
    case ClientMessageKind.SubmitAction:
      return (
        typeof raw['gameId'] === 'string' &&
        isObject(raw['action']) &&
        typeof (raw['action'] as Record<string, unknown>)['type'] === 'string'
      );
    case ClientMessageKind.LeaveGame:
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
