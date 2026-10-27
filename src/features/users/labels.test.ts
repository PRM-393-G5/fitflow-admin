import { describe, expect, it } from 'vitest';
import { activityLabel, formatKg, formatMinutes, goalLabel } from './labels';

describe('labels', () => {
  it("uses the app's wording for goals and activity", () => {
    expect(goalLabel('Strength')).toBe('Build muscle');
    expect(goalLabel('Cardio')).toBe('Lose fat');
    expect(goalLabel('Custom')).toBe('Custom');
    expect(activityLabel(0)).toBe('Sedentary');
    expect(activityLabel(4)).toBe('Athlete');
    expect(activityLabel(9)).toBe('Athlete');
    expect(activityLabel('Very active')).toBe('Very active');
  });

  it('formats durations and loads', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(125)).toBe('2 h 5 min');
    expect(formatKg(1234.56)).toBe('1,234.6 kg');
  });
});
