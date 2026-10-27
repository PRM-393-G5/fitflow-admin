import { describe, expect, it } from 'vitest';
import { estimateMinutes, fromFormValues, toFormValues } from './templateForm';
import type { Template } from './types';

const template: Template = {
  id: 'full-body-foundation',
  name: 'Full Body Foundation',
  durationMinutes: 17,
  level: 'Beginner',
  category: 'Strength',
  description: 'A balanced full-body session.',
  updatedAt: '2026-10-27T05:00:00.000Z',
  exercises: [
    {
      id: 'squat',
      name: 'Bodyweight Squat',
      muscleGroup: 'Legs',
      sets: 3,
      reps: 12,
      durationSeconds: 0,
      restSeconds: 45,
      weightKg: 0,
    },
    {
      id: 'plank',
      name: 'Plank',
      muscleGroup: 'Core',
      sets: 3,
      reps: 0,
      durationSeconds: 30,
      restSeconds: 30,
      weightKg: 0,
    },
  ],
};

describe('template form values', () => {
  it('round-trips a template, recomputing the duration', () => {
    const values = toFormValues(template);
    expect(values.exercises[1]).toMatchObject({ mode: 'timed', amount: 30 });
    const { updatedAt, durationMinutes, ...rest } = template;
    void updatedAt;
    void durationMinutes;
    expect(fromFormValues(values)).toEqual({ ...rest, durationMinutes: 8 });
  });

  it('trims text and gives new exercises ids', () => {
    const values = toFormValues(template);
    values.name = '  Renamed  ';
    values.exercises.push({
      name: ' Push-up ',
      muscleGroup: ' Chest ',
      sets: 3,
      mode: 'reps',
      amount: 10,
      restSeconds: 60,
      weightKg: 0,
    });
    const input = fromFormValues(values);
    expect(input.name).toBe('Renamed');
    expect(input.exercises[2]).toEqual({
      id: 'push-up',
      name: 'Push-up',
      muscleGroup: 'Chest',
      sets: 3,
      reps: 10,
      durationSeconds: 0,
      restSeconds: 60,
      weightKg: 0,
    });
  });
});

describe('estimateMinutes (the app formula)', () => {
  it('counts ~3 s per rep (20–600 s) or the hold, plus rest, per set', () => {
    // Squat 3 × (36 + 45) = 243 s, plank 3 × (30 + 30) = 180 s → 423 s.
    expect(estimateMinutes(template.exercises)).toBe(8);
    // 5 reps still take 20 s.
    expect(
      estimateMinutes([
        { sets: 1, reps: 5, durationSeconds: 0, restSeconds: 0 },
      ]),
    ).toBe(1);
    expect(estimateMinutes([])).toBe(1);
    expect(
      estimateMinutes([
        { sets: 20, reps: 0, durationSeconds: 3600, restSeconds: 900 },
      ]),
    ).toBe(600);
  });
});
