import { getCardDefinition } from '../cards/catalog';
import type { GameState } from '../model/game-state';
import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameId,
  PlayerId,
} from '../model/types';
import { emptyCombat, emptyManaPool, makeCardInstanceId } from '../model/types';
import { nextInt } from './rng';
import { shuffle } from './shuffle';

export type PlayerSetup = {
  id: PlayerId;
  name: string;
  decklist: CardDefinitionId[];
  startingLife?: number;
  startingHandSize?: number;
};

export type GameSetup = {
  id: GameId;
  seed: number;
  players: [PlayerSetup, PlayerSetup];
};

const DEFAULT_LIFE = 20;
const DEFAULT_HAND_SIZE = 7;

export const setupGame = (setup: GameSetup): GameState => {
  const cards: Record<CardInstanceId, CardInstance> = {};
  let instanceCounter = 0;

  const makeInstance = (ownerId: PlayerId, defId: CardDefinitionId): CardInstance => {
    instanceCounter += 1;
    const id = makeCardInstanceId(`c${instanceCounter}`);
    return {
      id,
      definitionId: defId,
      ownerId,
      controllerId: ownerId,
      zone: 'library',
      tapped: false,
      powerMod: 0,
      toughnessMod: 0,
      damage: 0,
      summoningSick: false,
    };
  };

  let rngState = setup.seed >>> 0;

  const playerIds: [PlayerId, PlayerId] = [setup.players[0].id, setup.players[1].id];
  const players: Record<PlayerId, GameState['players'][PlayerId]> = {} as Record<
    PlayerId,
    GameState['players'][PlayerId]
  >;

  for (const ps of setup.players) {
    const startingLife = ps.startingLife ?? DEFAULT_LIFE;
    const startingHand = ps.startingHandSize ?? DEFAULT_HAND_SIZE;

    const instanceIds = ps.decklist.map((defId) => {
      getCardDefinition(defId);
      const inst = makeInstance(ps.id, defId);
      cards[inst.id] = inst;
      return inst.id;
    });

    const shuffled = shuffle(instanceIds, rngState);
    rngState = shuffled.state;

    const library = shuffled.items.slice();
    const hand: CardInstanceId[] = [];
    for (let i = 0; i < Math.min(startingHand, library.length); i++) {
      const drawn = library.shift();
      if (drawn === undefined) break;
      cards[drawn] = { ...cards[drawn], zone: 'hand' };
      hand.push(drawn);
    }

    players[ps.id] = {
      id: ps.id,
      name: ps.name,
      life: startingLife,
      manaPool: emptyManaPool(),
      library,
      hand,
      graveyard: [],
      exile: [],
      landsPlayedThisTurn: 0,
    };
  }

  const pick = nextInt(rngState, 2);
  rngState = pick.state;
  const startingPlayerIndex = pick.value as 0 | 1;
  const activePlayer = playerIds[startingPlayerIndex];
  const playerOrder: [PlayerId, PlayerId] = [
    activePlayer,
    playerIds[startingPlayerIndex === 0 ? 1 : 0],
  ];

  return {
    id: setup.id,
    status: 'active',
    playerOrder,
    players,
    cards,
    battlefield: [],
    stack: [],
    activePlayer,
    priorityPlayer: activePlayer,
    consecutivePasses: 0,
    turn: 1,
    step: 'main1',
    combat: emptyCombat(),
    seed: setup.seed,
    rngState,
    losers: [],
    winner: null,
  };
};
