import type { ManaColor, ManaCost, ManaPool } from '../model/types';

const COLORS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

export const manaSpentMatchesCost = (
  cost: ManaCost,
  spent: Partial<Record<ManaColor, number>>,
): { ok: true } | { ok: false; reason: string } => {
  const required: Partial<Record<ManaColor, number>> = {};
  for (const c of COLORS) {
    const r = cost[c] ?? 0;
    if (r > 0) required[c] = r;
  }
  const generic = cost.generic ?? 0;

  let totalSpent = 0;
  for (const c of COLORS) totalSpent += spent[c] ?? 0;
  let needed = 0;
  for (const c of COLORS) needed += required[c] ?? 0;
  needed += generic;
  if (totalSpent !== needed) {
    return { ok: false, reason: `mana cost expects ${needed} mana, spent ${totalSpent}` };
  }
  for (const c of COLORS) {
    const r = required[c] ?? 0;
    const s = spent[c] ?? 0;
    if (s < r) return { ok: false, reason: `missing ${r - s} ${c} mana` };
  }
  return { ok: true };
};

export const poolHasAtLeast = (
  pool: ManaPool,
  spent: Partial<Record<ManaColor, number>>,
): { ok: true } | { ok: false; reason: string } => {
  for (const c of COLORS) {
    const need = spent[c] ?? 0;
    if (pool[c] < need) return { ok: false, reason: `not enough ${c} mana in pool` };
  }
  return { ok: true };
};

export const totalSpent = (spent: Partial<Record<ManaColor, number>>): number => {
  let t = 0;
  for (const c of COLORS) t += spent[c] ?? 0;
  return t;
};
