import type { CardInstanceId, PlayerId } from '../../model/types';
import { type TargetKind } from '../../model/types';

export enum EffectType {
  DealDamageToAny = 'deal_damage_to_any',
  DrawCards = 'draw_cards',
  GainLife = 'gain_life',
}

export type EffectTarget =
  | { kind: TargetKind.Player; playerId: PlayerId }
  | { kind: TargetKind.Permanent; cardId: CardInstanceId };

export type DealDamageToAny = {
  type: EffectType.DealDamageToAny;
  amount: number;
};

export type DrawCards = {
  type: EffectType.DrawCards;
  count: number;
};

export type GainLife = {
  type: EffectType.GainLife;
  amount: number;
};

export type Effect = DealDamageToAny | DrawCards | GainLife;
