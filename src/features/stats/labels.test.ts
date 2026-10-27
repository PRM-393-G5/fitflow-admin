import { describe, expect, it } from 'vitest';
import { errorLabel } from './labels';

describe('errorLabel', () => {
  it('explains known codes and never leaves a failure blank', () => {
    expect(errorLabel('rate-limited')).toBe('OpenAI rate limit');
    expect(errorLabel('http-418')).toBe('http-418');
    expect(errorLabel(null)).toBe('Unknown error');
    expect(errorLabel('unknown')).toBe('Unknown error');
  });
});
