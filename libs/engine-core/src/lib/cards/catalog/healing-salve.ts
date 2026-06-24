import { CardType, makeCardDefinitionId } from '../../model/types';
import type { CardDefinition } from '../card-definition';
import { EffectType } from '../effects/effect-types';

export const healingSalve: CardDefinition = {
  id: makeCardDefinitionId('healing-salve'),
  name: 'Healing Salve',
  superTypes: [],
  types: [CardType.Sorcery],
  subtypes: [],
  manaCost: { W: 1 },
  cmc: 1,
  keywords: [],
  effects: [{ type: EffectType.GainLife, amount: 3 }],
};
