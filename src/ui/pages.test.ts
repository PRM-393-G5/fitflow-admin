import { describe, expect, it } from 'vitest';
import { pageItems } from './pages';

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('folds skipped runs into one gap each', () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 'gap', 10]);
    expect(pageItems(6, 10)).toEqual([1, 'gap', 5, 6, 7, 'gap', 10]);
    expect(pageItems(10, 10)).toEqual([1, 'gap', 9, 10]);
  });

  it('shows a lone hidden page instead of a gap', () => {
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });
});
