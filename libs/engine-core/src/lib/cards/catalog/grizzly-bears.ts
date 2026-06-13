import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const grizzlyBears: CardDefinition = {
  id: makeCardDefinitionId('grizzly-bears'),
  name: 'Grizzly Bears',
  superTypes: [],
  types: ['creature'],
  subtypes: ['Bear'],
  manaCost: { G: 1, generic: 1 },
  cmc: 2,
  power: 2,
  toughness: 2,
  keywords: [],
};
