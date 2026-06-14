import { describe, expect, it } from 'vitest';
import { err, ok } from './result';

describe('Result', () => {
  it('ok carries the value', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(42);
    }
  });

  it('err carries the error', () => {
    const r = err('nope');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('nope');
    }
  });
});
