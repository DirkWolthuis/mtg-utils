import type { CardDefinition } from '../card-definition';
import type { CardDefinitionId } from '../../model/types';
import { makeCardDefinitionId } from '../../model/types';

import { forest } from './forest';
import { mountain } from './mountain';
import { grizzlyBears } from './grizzly-bears';
import { hillGiant } from './hill-giant';
import { lightningStrike } from './lightning-strike';
import { healingSalve } from './healing-salve';

const list: CardDefinition[] = [
  forest,
  mountain,
  grizzlyBears,
  hillGiant,
  lightningStrike,
  healingSalve,
];

export const catalog: Record<CardDefinitionId, CardDefinition> = Object.fromEntries(
  list.map((c) => [c.id, c]),
) as Record<CardDefinitionId, CardDefinition>;

export const getCardDefinition = (id: CardDefinitionId): CardDefinition => {
  const def = catalog[id];
  if (!def) throw new Error(`Unknown card definition: ${id as string}`);
  return def;
};

export const defId = (s: string): CardDefinitionId => makeCardDefinitionId(s);

export { forest, mountain, grizzlyBears, hillGiant, lightningStrike, healingSalve };
