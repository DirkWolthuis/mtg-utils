import { makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';

export const healingSalve: CardDefinition = {
  id: makeCardDefinitionId('healing-salve'),
  name: 'Healing Salve',
  superTypes: [],
  types: ['sorcery'],
  subtypes: [],
  manaCost: { W: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ type: 'gain_life', amount: 3 }],
};
