import { describe, expect, it } from 'vitest';
import { makeCardDefinitionId, makeGameId, makePlayerId } from '../model/types';
import { setupGame } from './setup';

const deck = () => [
  ...Array(20).fill(makeCardDefinitionId('forest')),
  ...Array(20).fill(makeCardDefinitionId('grizzly-bears')),
];

describe('setupGame', () => {
  it('shuffles deterministically by seed', () => {
    const sa = setupGame({
      id: makeGameId('g1'),
      seed: 42,
      players: [
        { id: makePlayerId('p1'), name: 'A', decklist: deck() },
        { id: makePlayerId('p2'), name: 'B', decklist: deck() },
      ],
    });
    const sb = setupGame({
      id: makeGameId('g1'),
      seed: 42,
      players: [
        { id: makePlayerId('p1'), name: 'A', decklist: deck() },
        { id: makePlayerId('p2'), name: 'B', decklist: deck() },
      ],
    });
    expect(sa.players[makePlayerId('p1')].library).toEqual(sb.players[makePlayerId('p1')].library);
    expect(sa.players[makePlayerId('p1')].hand.length).toBe(7);
    expect(sa.activePlayer).toBe(sb.activePlayer);
  });

  it('differs between seeds', () => {
    const sa = setupGame({
      id: makeGameId('g1'),
      seed: 1,
      players: [
        { id: makePlayerId('p1'), name: 'A', decklist: deck() },
        { id: makePlayerId('p2'), name: 'B', decklist: deck() },
      ],
    });
    const sb = setupGame({
      id: makeGameId('g1'),
      seed: 2,
      players: [
        { id: makePlayerId('p1'), name: 'A', decklist: deck() },
        { id: makePlayerId('p2'), name: 'B', decklist: deck() },
      ],
    });
    expect(sa.players[makePlayerId('p1')].library).not.toEqual(
      sb.players[makePlayerId('p1')].library,
    );
  });
});
