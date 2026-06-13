import type { CardDefinition } from '../card-definition';
import { makeCardDefinitionId } from '../../model/types';

export const healingSalve: CardDefinition = {
  id: makeCardDefinitionId('healing-salve'),
  name: 'Healing Salve',
  superTypes: [],
  types: ['sorcery'],
  subtypes: [],
  manaCost: { W: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ kind: 'gain_life', amount: 3 }],
};
