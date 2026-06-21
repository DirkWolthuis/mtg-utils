import type { CardDefinitionId } from '../../model/types';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

import { forest } from './forest';
import { grizzlyBears } from './grizzly-bears';
import { healingSalve } from './healing-salve';
import { hillGiant } from './hill-giant';
import { lightningBolt } from './lightning-bolt';
import { lightningStrike } from './lightning-strike';
import { mountain } from './mountain';

const list: CardDefinition[] = [
  forest,
  mountain,
  grizzlyBears,
  hillGiant,
  lightningStrike,
  lightningBolt,
  healingSalve,
];

export const catalog: Record<CardDefinitionId, CardDefinition> = Object.fromEntries(
  list.map((c) => [c.id, c]),
) as Record<CardDefinitionId, CardDefinition>;

export const getCardDefinition = (id: CardDefinitionId): CardDefinition => {
  const def = catalog[id];
  if (!def) {
    throw new Error(`Unknown card definition: ${id as string}`);
  }
  return def;
};

export const defId = (s: string): CardDefinitionId => makeCardDefinitionId(s);

export { forest, grizzlyBears, healingSalve, hillGiant, lightningBolt, lightningStrike, mountain };
