import type { GameState } from '../model/game-state';
import type { StackItem } from '../model/stack';
import type { CardInstance, CardInstanceId, Player, PlayerId } from '../model/types';
import { Zone } from '../model/types';

export type OpponentView = {
  id: PlayerId;
  name: string;
  life: number;
  libraryCount: number;
  handCount: number;
  graveyard: CardInstanceId[];
  exile: CardInstanceId[];
  manaPool: Player['manaPool'];
  landsPlayedThisTurn: number;
};

export type PlayerView = {
  forPlayer: PlayerId;
  gameId: GameState['id'];
  status: GameState['status'];
  turn: number;
  step: GameState['step'];
  activePlayer: PlayerId;
  priorityPlayer: PlayerId | null;
  winner: PlayerId | null;
  combat: GameState['combat'];
  battlefield: CardInstanceId[];
  stack: StackItem[];
  /** Card data: only includes cards the viewing player is allowed to see */
  cards: Record<CardInstanceId, CardInstance>;
  self: Player;
  opponent: OpponentView;
};

export const projectFor = (state: GameState, viewer: PlayerId): PlayerView => {
  const opponentId = state.playerOrder[0] === viewer ? state.playerOrder[1] : state.playerOrder[0];
  const self = state.players[viewer];
  const opp = state.players[opponentId];

  const cards: Record<CardInstanceId, CardInstance> = {};
  const isVisible = (c: CardInstance): boolean => {
    if (c.ownerId === viewer) {
      return c.zone !== Zone.Library;
    }
    return (
      c.zone === Zone.Battlefield ||
      c.zone === Zone.Graveyard ||
      c.zone === Zone.Exile ||
      c.zone === Zone.Stack
    );
  };
  for (const id of Object.keys(state.cards) as CardInstanceId[]) {
    const c = state.cards[id];
    if (isVisible(c)) {
      cards[id] = c;
    }
  }

  const opponent: OpponentView = {
    id: opponentId,
    name: opp.name,
    life: opp.life,
    libraryCount: opp.library.length,
    handCount: opp.hand.length,
    graveyard: opp.graveyard.slice(),
    exile: opp.exile.slice(),
    manaPool: { ...opp.manaPool },
    landsPlayedThisTurn: opp.landsPlayedThisTurn,
  };

  return {
    forPlayer: viewer,
    gameId: state.id,
    status: state.status,
    turn: state.turn,
    step: state.step,
    activePlayer: state.activePlayer,
    priorityPlayer: state.priorityPlayer,
    winner: state.winner,
    combat: state.combat,
    battlefield: state.battlefield.slice(),
    stack: state.stack.slice(),
    cards,
    self,
    opponent,
  };
};
