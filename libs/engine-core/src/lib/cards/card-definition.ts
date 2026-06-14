import type {
  CardDefinitionId,
  CardType,
  Keyword,
  ManaColor,
  ManaCost,
  SuperType,
} from '../model/types';
import type { Effect } from './effects/effect-types';

export type CardDefinition = {
  id: CardDefinitionId;
  name: string;
  superTypes: SuperType[];
  types: CardType[];
  subtypes: string[];
  manaCost: ManaCost | null;
  cmc: number;
  power?: number;
  toughness?: number;
  keywords: Keyword[];
  produces?: ManaColor[];
  effects?: Effect[];
  flavorText?: string;
};
