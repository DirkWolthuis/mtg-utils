import type {
  CardInstance,
  CardInstanceId,
  CombatState,
  GameId,
  GameStatus,
  Player,
  PlayerId,
  Step,
} from './types';

export interface GameState {
  id: GameId;
  status: GameStatus;
  playerOrder: [PlayerId, PlayerId];
  players: Record<PlayerId, Player>;
  cards: Record<CardInstanceId, CardInstance>;
  battlefield: CardInstanceId[];
  activePlayer: PlayerId;
  turn: number;
  step: Step;
  combat: CombatState;
  seed: number;
  rngState: number;
  losers: PlayerId[];
  winner: PlayerId | null;
}

export const otherPlayer = (state: GameState, playerId: PlayerId): PlayerId =>
  state.playerOrder[0] === playerId ? state.playerOrder[1] : state.playerOrder[0];
