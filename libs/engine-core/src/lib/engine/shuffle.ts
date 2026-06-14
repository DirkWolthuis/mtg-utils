import { nextInt } from './rng';

export const shuffle = <T>(
  items: readonly T[],
  rngState: number,
): { items: T[]; state: number } => {
  const copy = items.slice();
  let state = rngState;
  for (let i = copy.length - 1; i > 0; i--) {
    const step = nextInt(state, i + 1);
    state = step.state;
    const j = step.value;
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return { items: copy, state };
};
