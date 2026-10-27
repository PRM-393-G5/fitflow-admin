import { describe, expect, it } from 'vitest';
import { formatCount, formatDay, formatTick } from './tokens';

describe('chart formatting', () => {
  it('compacts counts from 10,000 and ticks from 1,000', () => {
    expect(formatCount(1284)).toBe('1,284');
    expect(formatCount(12_900)).toBe('12.9K');
    expect(formatTick(500)).toBe('500');
    expect(formatTick(2000)).toBe('2K');
  });

  it('shows a day without shifting it by the time zone', () => {
    expect(formatDay('2026-10-27')).toBe('27 Oct');
    expect(formatDay('2027-01-01')).toBe('1 Jan');
  });
});
