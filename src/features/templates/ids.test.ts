import { describe, expect, it } from 'vitest';
import { assignExerciseIds, slugify, templateIdFor } from './ids';

describe('slugify', () => {
  it('makes lowercase dashed words without accents', () => {
    expect(slugify('Đẩy ngực nâng cao')).toBe('day-nguc-nang-cao');
    expect(slugify('  Push / Pull — Day #2 ')).toBe('push-pull-day-2');
    expect(slugify('!!!')).toBe('');
  });
});

describe('templateIdFor', () => {
  it('avoids the ids the app reserves', () => {
    expect(templateIdFor('Upper Power')).toBe('upper-power');
    expect(templateIdFor('Custom Legs')).toBe('plan-custom-legs');
    expect(templateIdFor('Form check')).toBe('plan-form-check');
    expect(templateIdFor('')).toBe('');
  });
});

describe('assignExerciseIds', () => {
  it('keeps existing ids and gives new exercises unique ones', () => {
    expect(
      assignExerciseIds([
        { id: 'squat', name: 'Squat' },
        { name: 'Squat' },
        { name: 'Squat' },
        { name: 'Bench Press' },
        { name: '???' },
      ]),
    ).toEqual(['squat', 'squat-2', 'squat-3', 'bench-press', 'exercise']);
  });
});
