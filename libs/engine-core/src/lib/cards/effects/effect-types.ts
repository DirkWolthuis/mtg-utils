import { type EffectType, type TargetKind } from '../../model/enums';
import type { CardInstanceId, PlayerId } from '../../model/types';

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

export type DestroyPermanent = {
  type: EffectType.DestroyPermanent;
};

export type Effect = DealDamageToAny | DrawCards | GainLife | DestroyPermanent;
