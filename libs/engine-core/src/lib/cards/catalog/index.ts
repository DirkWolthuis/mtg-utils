import type { CardDefinitionId } from '../../model/types';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

import { darkBanishing } from './dark-banishing';
import { forest } from './forest';
import { goblinPiker } from './goblin-piker';
import { grizzlyBears } from './grizzly-bears';
import { healingSalve } from './healing-salve';
import { hillGiant } from './hill-giant';
import { lightningBolt } from './lightning-bolt';
import { lightningStrike } from './lightning-strike';
import { llanowarElves } from './llanowar-elves';
import { mountain } from './mountain';
import { plains } from './plains';
import { savannahLions } from './savannah-lions';
import { swamp } from './swamp';

const list: CardDefinition[] = [
  forest,
  mountain,
  plains,
  swamp,
  grizzlyBears,
  hillGiant,
  lightningStrike,
  lightningBolt,
  healingSalve,
  savannahLions,
  goblinPiker,
  llanowarElves,
  darkBanishing,
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

export {
  darkBanishing,
  forest,
  goblinPiker,
  grizzlyBears,
  healingSalve,
  hillGiant,
  lightningBolt,
  lightningStrike,
  llanowarElves,
  mountain,
  plains,
  savannahLions,
  swamp,
};
