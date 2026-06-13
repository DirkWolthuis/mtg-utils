import * as repl from 'node:repl';
import { WebSocket } from 'ws';
import {
  getCardDefinition,
  type Action,
  type CardDefinitionId,
  type CardInstanceId,
  type ManaColor,
  type ManaCost,
  type ManaPool,
  type PlayerId,
  type PlayerView,
} from '@mtg-utils/engine-core';
import type { ClientMessage, ServerMessage } from '@mtg-utils/engine-protocol';

interface Args {
  player: string;
  name: string;
  game: string;
  port: number;
}

const parseArgs = (): Args => {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? (argv[i + 1] as string) : fallback;
  };
  return {
    player: get('--player', 'p1'),
    name: get('--name', 'Player'),
    game: get('--game', 'g1'),
    port: Number(get('--port', '8080')),
  };
};

const DEFAULT_DECK = [
  'forest', 'forest', 'forest', 'forest', 'forest', 'forest',
  'mountain', 'mountain', 'mountain', 'mountain', 'mountain', 'mountain',
  'grizzly-bears', 'grizzly-bears', 'grizzly-bears', 'grizzly-bears',
  'hill-giant', 'hill-giant',
  'lightning-strike', 'lightning-strike',
  'healing-salve',
] as CardDefinitionId[];

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

const computeSpent = (
  cost: ManaCost | null,
  pool: ManaPool,
): Partial<Record<ManaColor, number>> => {
  if (!cost) return {};
  const spent: Partial<Record<ManaColor, number>> = {};
  for (const c of COLORS) {
    const req = cost[c] ?? 0;
    if (req > 0) spent[c] = req;
  }
  let generic = cost.generic ?? 0;
  for (const c of COLORS) {
    if (generic <= 0) break;
    const avail = pool[c] - (spent[c] ?? 0);
    const use = Math.min(avail, generic);
    if (use > 0) {
      spent[c] = (spent[c] ?? 0) + use;
      generic -= use;
    }
  }
  return spent;
};

const printIncoming = (msg: ServerMessage): void => {
  switch (msg.kind) {
    case 'join_ack':
      console.log(`<- join_ack ready=${msg.ready}`);
      return;
    case 'state_sync':
      console.log(
        `<- state_sync turn=${msg.view.turn} step=${msg.view.step} active=${msg.view.activePlayer}`,
      );
      return;
    case 'event_batch':
      console.log(
        `<- event_batch (${msg.events.length} events) turn=${msg.view.turn} step=${msg.view.step}`,
      );
      for (const e of msg.events) {
        const summary =
          'cardId' in e ? ` ${(e as { cardId: string }).cardId}` :
          'playerId' in e ? ` ${(e as { playerId: string }).playerId}` :
          '';
        console.log(`   · ${e.kind}${summary}`);
      }
      return;
    case 'rejected_action':
      console.log(`<- REJECTED: ${msg.reason}`);
      return;
    case 'game_over':
      console.log(`<- GAME OVER, winner=${msg.winner ?? 'draw'}`);
      return;
    case 'server_error':
      console.log(`<- server_error: ${msg.message}`);
      return;
  }
};

const main = async (): Promise<void> => {
  const args = parseArgs();
  const playerId = args.player as PlayerId;
  let view: PlayerView | null = null;
  let lastMessage: ServerMessage | null = null;

  const ws = new WebSocket(`ws://localhost:${args.port}`);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString()) as ServerMessage;
    lastMessage = msg;
    if (msg.kind === 'state_sync' || msg.kind === 'event_batch') view = msg.view;
    printIncoming(msg);
  });

  ws.on('close', () => {
    console.log('<- connection closed');
  });

  const send = (msg: ClientMessage): void => {
    ws.send(JSON.stringify(msg));
  };

  const submit = (action: Action): void => {
    send({ kind: 'submit_action', gameId: args.game as never, action });
  };

  send({
    kind: 'join_game',
    gameId: args.game as never,
    playerId,
    name: args.name,
    deck: DEFAULT_DECK,
  });

  const requireView = (): PlayerView | null => {
    if (!view) {
      console.log('game has not started yet — waiting for opponent to join');
      return null;
    }
    return view;
  };

  const findInHand = (needle: string): CardInstanceId | undefined => {
    const v = view;
    if (!v) return undefined;
    const lowered = needle.toLowerCase();
    for (const id of v.self.hand) {
      const c = v.cards[id];
      if (!c) continue;
      const def = getCardDefinition(c.definitionId);
      if (def.name.toLowerCase().includes(lowered) || c.definitionId.toLowerCase().includes(lowered)) {
        return id;
      }
    }
    return undefined;
  };

  const findOnBattlefield = (
    needle: string,
    onlyMine = true,
  ): CardInstanceId | undefined => {
    const v = view;
    if (!v) return undefined;
    const lowered = needle.toLowerCase();
    for (const id of v.battlefield) {
      const c = v.cards[id];
      if (!c) continue;
      if (onlyMine && c.controllerId !== v.forPlayer) continue;
      const def = getCardDefinition(c.definitionId);
      if (def.name.toLowerCase().includes(lowered) || c.definitionId.toLowerCase().includes(lowered)) {
        return id;
      }
    }
    return undefined;
  };

  const helpers = {
    /** Latest view (raw object). */
    state: () => view,
    /** Latest incoming server message. */
    last: () => lastMessage,
    /** Pretty list of cards in your hand. */
    hand: () => {
      const v = requireView();
      if (!v) return;
      console.table(
        v.self.hand.map((id) => ({
          id,
          name: getCardDefinition(v.cards[id]!.definitionId).name,
        })),
      );
    },
    /** Pretty list of your battlefield (or both with `bf(false)`). */
    bf: (mineOnly = true) => {
      const v = requireView();
      if (!v) return;
      console.table(
        v.battlefield
          .map((id) => {
            const c = v.cards[id]!;
            if (mineOnly && c.controllerId !== v.forPlayer) return null;
            const def = getCardDefinition(c.definitionId);
            return {
              id,
              ctrl: c.controllerId,
              name: def.name,
              tapped: c.tapped,
              sick: c.summoningSick,
              dmg: c.damage,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null),
      );
    },
    /** Mana pool, life, step, etc. */
    me: () => {
      const v = requireView();
      if (!v) return;
      console.log(
        `turn=${v.turn} step=${v.step} active=${v.activePlayer} life=${v.self.life}/${v.opponent.life}`,
        'mana=',
        v.self.manaPool,
      );
    },
    /** Play a land, cast a creature, or cast a sorcery (auto-detects card type). */
    play: (name: string, opts?: { target?: 'opp' | 'me' | string }) => {
      const v = requireView();
      if (!v) return;
      const id = findInHand(name);
      if (!id) return console.log(`no card matching "${name}" in hand`);
      const def = getCardDefinition(v.cards[id]!.definitionId);
      if (def.types.includes('land')) {
        submit({ kind: 'play_land', playerId, cardId: id });
        return;
      }
      const spent = computeSpent(def.manaCost, v.self.manaPool);
      if (def.types.includes('creature')) {
        submit({ kind: 'cast_creature', playerId, cardId: id, manaSpent: spent });
        return;
      }
      if (def.types.includes('sorcery')) {
        const targetPlayer =
          opts?.target === 'me' ? v.forPlayer : (v.opponent.id as PlayerId);
        const targets = (def.effects ?? [])
          .filter((e) => e.kind === 'deal_damage_to_any')
          .map(() => ({ kind: 'player' as const, playerId: targetPlayer }));
        submit({
          kind: 'cast_sorcery',
          playerId,
          cardId: id,
          manaSpent: spent,
          targets,
        });
        return;
      }
      console.log(`don't know how to play "${def.name}"`);
    },
    /** Tap a land you control for one mana of the given color. */
    tap: (name: string, color: ManaColor) => {
      const v = requireView();
      if (!v) return;
      const id = findOnBattlefield(name);
      if (!id) return console.log(`no permanent matching "${name}" on your battlefield`);
      submit({ kind: 'tap_land_for_mana', playerId, cardId: id, color });
    },
    /** Declare attackers (your creatures by name). */
    attack: (names: string[]) => {
      const v = requireView();
      if (!v) return;
      const ids = names
        .map((n) => findOnBattlefield(n))
        .filter((id): id is CardInstanceId => Boolean(id));
      if (ids.length !== names.length) return console.log('some names did not match');
      submit({ kind: 'declare_attackers', playerId, attackerIds: ids });
    },
    /** Declare blockers: pairs of [blockerName, attackerName]. */
    block: (pairs: [string, string][]) => {
      const v = requireView();
      if (!v) return;
      const assignments = pairs.map(([b, a]) => ({
        blockerId: findOnBattlefield(b) as CardInstanceId,
        attackerId: findOnBattlefield(a, false) as CardInstanceId,
      }));
      submit({ kind: 'declare_blockers', playerId, assignments });
    },
    /** Pass to the next step. */
    pass: () => submit({ kind: 'pass_step', playerId }),
    /** Concede the game. */
    concede: () => submit({ kind: 'concede', playerId }),
    /** Print the helper list. */
    help: () => {
      console.log(`
Available helpers:
  me()                            — turn, step, life, mana
  hand()                          — your hand
  bf()                            — your battlefield  (bf(false) for both)
  state()                         — raw PlayerView
  last()                          — last server message

  play("forest")                  — play a land
  play("bears")                   — cast a creature
  play("strike", { target: "opp" }) — cast a sorcery
  tap("forest", "G")              — tap a land for mana
  attack(["bears", "giant"])      — declare attackers
  block([["bears", "giant"]])     — declare blockers (blocker, attacker)
  pass()                          — pass to next step
  concede()                       — concede the game
`);
    },
  };

  console.log(`Connected to ws://localhost:${args.port} as ${playerId} (game=${args.game})`);
  console.log('Type help() for available commands.');

  const r = repl.start({ prompt: `mtg(${args.player})> `, useColors: true });
  Object.assign(r.context, helpers);

  r.on('exit', () => {
    ws.close();
    process.exit(0);
  });
};

main().catch((e) => {
  console.error('REPL failed:', e);
  process.exit(1);
});
