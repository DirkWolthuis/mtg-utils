import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const hillGiant: CardDefinition = {
  id: makeCardDefinitionId('hill-giant'),
  name: 'Hill Giant',
  superTypes: [],
  types: ['creature'],
  subtypes: ['Giant'],
  manaCost: { R: 1, generic: 3 },
  cmc: 4,
  power: 3,
  toughness: 3,
  keywords: [],
};
