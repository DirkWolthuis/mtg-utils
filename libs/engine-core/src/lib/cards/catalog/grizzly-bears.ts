import { CardType, makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const grizzlyBears: CardDefinition = {
  id: makeCardDefinitionId('grizzly-bears'),
  name: 'Grizzly Bears',
  superTypes: [],
  types: [CardType.Creature],
  subtypes: ['Bear'],
  manaCost: { G: 1, generic: 1 },
  cmc: 2,
  power: 2,
  toughness: 2,
  keywords: [],
};
