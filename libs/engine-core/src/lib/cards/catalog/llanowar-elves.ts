import { CardType } from '../../model/enums';
import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const llanowarElves: CardDefinition = {
  id: makeCardDefinitionId('llanowar-elves'),
  name: 'Llanowar Elves',
  superTypes: [],
  types: [CardType.Creature],
  subtypes: ['Elf', 'Druid'],
  manaCost: { G: 1 },
  cmc: 1,
  power: 1,
  toughness: 1,
  keywords: [],
};
