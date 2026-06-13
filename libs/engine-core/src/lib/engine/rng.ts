export interface RngStep {
  value: number;
  state: number;
}

export const mulberry32 = (state: number): RngStep => {
  let t = (state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: t >>> 0 };
};

export const nextInt = (state: number, maxExclusive: number): { value: number; state: number } => {
  const step = mulberry32(state);
  return { value: Math.floor(step.value * maxExclusive), state: step.state };
};
