import { describe, expect, it } from 'vitest';
import { setupGame } from './setup';
import { createDefaultEngine } from './default-engine';
import {
  makeCardDefinitionId,
  makeGameId,
  makePlayerId,
  type CardInstanceId,
  type PlayerId,
} from '../model/types';
import type { GameState } from '../model/game-state';
import type { Action } from '../actions/action';

const FOREST = makeCardDefinitionId('forest');
const MOUNTAIN = makeCardDefinitionId('mountain');
const BEARS = makeCardDefinitionId('grizzly-bears');
const BOLT = makeCardDefinitionId('lightning-strike');
const INSTANT_BOLT = makeCardDefinitionId('lightning-bolt');
const SALVE = makeCardDefinitionId('healing-salve');

const P1 = makePlayerId('p1');
const P2 = makePlayerId('p2');

const startBasicGame = (): { state: GameState; engine: ReturnType<typeof createDefaultEngine> } => {
  const state = setupGame({
    id: makeGameId('g'),
    seed: 7,
    players: [
      {
        id: P1,
        name: 'A',
        decklist: [
          FOREST, FOREST, FOREST, MOUNTAIN, MOUNTAIN,
          BEARS, BEARS, BEARS, BEARS, BEARS,
          BOLT, BOLT, SALVE, INSTANT_BOLT,
        ],
      },
      {
        id: P2,
        name: 'B',
        decklist: [
          MOUNTAIN, MOUNTAIN, MOUNTAIN, FOREST, FOREST,
          BEARS, BEARS, BEARS, BEARS, BEARS,
          BOLT, BOLT, SALVE, INSTANT_BOLT,
        ],
      },
    ],
  });
  return { state, engine: createDefaultEngine() };
};

const findInHand = (
  state: GameState,
  playerId: PlayerId,
  defId: ReturnType<typeof makeCardDefinitionId>,
): CardInstanceId | undefined => {
  for (const id of state.players[playerId].hand) {
    if (state.cards[id].definitionId === defId) return id;
  }
  return undefined;
};

const findOnBattlefield = (
  state: GameState,
  controllerId: PlayerId,
  defId: ReturnType<typeof makeCardDefinitionId>,
): CardInstanceId | undefined => {
  for (const id of state.battlefield) {
    const c = state.cards[id];
    if (c.controllerId === controllerId && c.definitionId === defId) return id;
  }
  return undefined;
};

const apply = (
  engine: ReturnType<typeof createDefaultEngine>,
  state: GameState,
  action: Action,
): GameState => {
  const r = engine.apply(state, action);
  if (!r.ok) throw new Error(`action ${action.kind} rejected: ${r.error}`);
  return r.value.state;
};

describe('engine', () => {
  const ensureInHand = (
    state: GameState,
    playerId: PlayerId,
    defId: ReturnType<typeof makeCardDefinitionId>,
  ): { state: GameState; cardId: CardInstanceId } => {
    const existing = findInHand(state, playerId, defId);
    if (existing) return { state, cardId: existing };
    // Swap top of library for one with the desired definition.
    const lib = state.players[playerId].library;
    let targetId: CardInstanceId | undefined;
    for (const id of lib) {
      if (state.cards[id].definitionId === defId) {
        targetId = id;
        break;
      }
    }
    if (!targetId) throw new Error(`no ${defId} in deck`);
    const handCard = state.players[playerId].hand[0];
    if (!handCard) throw new Error('hand empty');
    const newHand = state.players[playerId].hand.slice();
    const newLib = state.players[playerId].library.slice();
    const handIdx = 0;
    const libIdx = newLib.indexOf(targetId);
    newHand[handIdx] = targetId;
    newLib[libIdx] = handCard;
    return {
      state: {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...state.players[playerId], hand: newHand, library: newLib },
        },
        cards: {
          ...state.cards,
          [targetId]: { ...state.cards[targetId], zone: 'hand' },
          [handCard]: { ...state.cards[handCard], zone: 'library' },
        },
      },
      cardId: targetId,
    };
  };

  it('allows the active player to play a land in main1', () => {
    const start = startBasicGame();
    const active = start.state.activePlayer;
    const { state, cardId: forestId } = ensureInHand(start.state, active, FOREST);
    const next = apply(start.engine, state, { kind: 'play_land', playerId: active, cardId: forestId });
    expect(next.players[active].landsPlayedThisTurn).toBe(1);
    expect(next.cards[forestId].zone).toBe('battlefield');
  });

  it('rejects casting a creature without enough mana', () => {
    const { state, engine } = startBasicGame();
    const active = state.activePlayer;
    const bearsId = findInHand(state, active, BEARS);
    if (!bearsId) throw new Error('test deck must seat a bears in opening hand');
    const r = engine.apply(state, {
      kind: 'cast_creature',
      playerId: active,
      cardId: bearsId,
      manaSpent: { G: 1, C: 1 },
    });
    expect(r.ok).toBe(false);
  });

  it('plays a land then taps it for mana', () => {
    const start = startBasicGame();
    const active = start.state.activePlayer;
    const seated = ensureInHand(start.state, active, FOREST);
    let s = apply(start.engine, seated.state, {
      kind: 'play_land',
      playerId: active,
      cardId: seated.cardId,
    });
    const tapResult = start.engine.apply(s, {
      kind: 'tap_land_for_mana',
      playerId: active,
      cardId: seated.cardId,
      color: 'G',
    });
    expect(tapResult.ok).toBe(true);
    if (tapResult.ok) s = tapResult.value.state;
    expect(s.cards[seated.cardId].tapped).toBe(true);
    expect(s.players[active].manaPool.G).toBe(1);
  });

  it('sorcery goes on the stack, resolves only after both pass priority', () => {
    const start = startBasicGame();
    const active = start.state.activePlayer;
    const opponent = active === P1 ? P2 : P1;
    const seated = ensureInHand(start.state, active, BOLT);
    const engine = start.engine;
    const boltId = seated.cardId;

    let s: GameState = {
      ...seated.state,
      players: {
        ...seated.state.players,
        [active]: { ...seated.state.players[active], manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 1 } },
      },
    };

    s = apply(engine, s, {
      kind: 'cast_sorcery',
      playerId: active,
      cardId: boltId,
      manaSpent: { R: 1, C: 1 },
      targets: [{ kind: 'player', playerId: opponent }],
    });
    // After cast: spell on stack, no damage yet
    expect(s.stack.length).toBe(1);
    expect(s.cards[boltId].zone).toBe('stack');
    expect(s.players[opponent].life).toBe(20);

    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    expect(s.stack.length).toBe(1);
    expect(s.players[opponent].life).toBe(20);

    s = apply(engine, s, { kind: 'pass_priority', playerId: opponent });
    // Both passed: top of stack resolves
    expect(s.stack.length).toBe(0);
    expect(s.players[opponent].life).toBe(17);
    expect(s.cards[boltId].zone).toBe('graveyard');
  });

  it('instant can be cast by the non-active player during the active player\'s turn', () => {
    const start = startBasicGame();
    const active = start.state.activePlayer;
    const opponent = active === P1 ? P2 : P1;
    const seated = ensureInHand(start.state, opponent, INSTANT_BOLT);
    const engine = start.engine;
    const boltId = seated.cardId;

    let s: GameState = {
      ...seated.state,
      players: {
        ...seated.state.players,
        [opponent]: { ...seated.state.players[opponent], manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 } },
      },
    };
    // Active player passes priority so opponent has priority
    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    expect(s.priorityPlayer).toBe(opponent);

    // Opponent casts Lightning Bolt at active player
    s = apply(engine, s, {
      kind: 'cast_instant',
      playerId: opponent,
      cardId: boltId,
      manaSpent: { R: 1 },
      targets: [{ kind: 'player', playerId: active }],
    });
    expect(s.stack.length).toBe(1);
    expect(s.players[active].life).toBe(20);
    // After spell cast, caster (opponent) gets priority back
    expect(s.priorityPlayer).toBe(opponent);

    s = apply(engine, s, { kind: 'pass_priority', playerId: opponent });
    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    expect(s.players[active].life).toBe(17);
    expect(s.stack.length).toBe(0);
  });

  it('stack resolves LIFO: instant cast in response to a sorcery resolves first', () => {
    const start = startBasicGame();
    const active = start.state.activePlayer;
    const opponent = active === P1 ? P2 : P1;
    const seatedSorc = ensureInHand(start.state, active, BOLT);
    const seatedInst = ensureInHand(seatedSorc.state, opponent, INSTANT_BOLT);
    const engine = start.engine;

    let s: GameState = {
      ...seatedInst.state,
      players: {
        ...seatedInst.state.players,
        [active]: { ...seatedInst.state.players[active], manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 1 } },
        [opponent]: { ...seatedInst.state.players[opponent], manaPool: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 } },
      },
    };

    // Active casts Lightning Strike at the opponent (sorcery)
    s = apply(engine, s, {
      kind: 'cast_sorcery',
      playerId: active,
      cardId: seatedSorc.cardId,
      manaSpent: { R: 1, C: 1 },
      targets: [{ kind: 'player', playerId: opponent }],
    });
    expect(s.stack.length).toBe(1);

    // Active passes priority to opponent
    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    expect(s.priorityPlayer).toBe(opponent);

    // Opponent casts Lightning Bolt at the active player in response (instant)
    s = apply(engine, s, {
      kind: 'cast_instant',
      playerId: opponent,
      cardId: seatedInst.cardId,
      manaSpent: { R: 1 },
      targets: [{ kind: 'player', playerId: active }],
    });
    expect(s.stack.length).toBe(2);
    // Both effects still pending — no life lost yet
    expect(s.players[active].life).toBe(20);
    expect(s.players[opponent].life).toBe(20);

    // Both pass: top of stack (instant) resolves first
    s = apply(engine, s, { kind: 'pass_priority', playerId: opponent });
    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    expect(s.stack.length).toBe(1);
    expect(s.players[active].life).toBe(17); // instant resolved
    expect(s.players[opponent].life).toBe(20); // sorcery still on stack

    // Both pass again: sorcery resolves
    s = apply(engine, s, { kind: 'pass_priority', playerId: active });
    s = apply(engine, s, { kind: 'pass_priority', playerId: opponent });
    expect(s.stack.length).toBe(0);
    expect(s.players[opponent].life).toBe(17);
  });

  it('a creature with lethal combat damage dies via SBA', () => {
    const { state, engine } = startBasicGame();
    const active = state.activePlayer;
    const opponent = active === P1 ? P2 : P1;

    // Seed both players with one ready bears on the battlefield, and bypass into
    // declare_attackers step. This bypasses normal play to exercise combat purely.
    const aBear: CardInstanceId = state.players[active].hand[0]
      ? state.players[active].hand[0]
      : state.players[active].library[0];
    const dBear: CardInstanceId = state.players[opponent].hand[0]
      ? state.players[opponent].hand[0]
      : state.players[opponent].library[0];

    const seeded: GameState = {
      ...state,
      step: 'declare_attackers',
      battlefield: [aBear, dBear],
      cards: {
        ...state.cards,
        [aBear]: {
          ...state.cards[aBear],
          definitionId: BEARS,
          ownerId: active,
          controllerId: active,
          zone: 'battlefield',
          tapped: false,
          summoningSick: false,
          damage: 0,
        },
        [dBear]: {
          ...state.cards[dBear],
          definitionId: BEARS,
          ownerId: opponent,
          controllerId: opponent,
          zone: 'battlefield',
          tapped: false,
          summoningSick: false,
          damage: 0,
        },
      },
    };

    const r1 = engine.apply(seeded, {
      kind: 'declare_attackers',
      playerId: active,
      attackerIds: [aBear],
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    // After DeclareAttackers, the step advances to declare_blockers (and from there
    // an auto-skip to combat_damage is not triggered since there ARE attackers — the
    // defender must declare blockers).
    expect(r1.value.state.step).toBe('declare_blockers');

    const r2 = engine.apply(r1.value.state, {
      kind: 'declare_blockers',
      playerId: opponent,
      assignments: [{ blockerId: dBear, attackerId: aBear }],
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    // After blockers, step_advanced to combat_damage which triggers damage events.
    // Both 2/2 bears trade.
    expect(r2.value.state.cards[aBear].zone).toBe('graveyard');
    expect(r2.value.state.cards[dBear].zone).toBe('graveyard');
  });
});
