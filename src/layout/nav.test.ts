import { describe, expect, it } from 'vitest';
import { activeNavPath } from './nav';

describe('activeNavPath', () => {
  it('highlights the dashboard for the root and unknown paths', () => {
    expect(activeNavPath('/')).toBe('/');
    expect(activeNavPath('/nowhere')).toBe('/');
  });
});
