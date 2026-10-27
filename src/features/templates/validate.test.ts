import { describe, expect, it } from 'vitest';
import { NEW_EXERCISE, type TemplateFormValues } from './templateForm';
import { hasErrors, validateExercise, validateTemplate } from './validate';

const valid: TemplateFormValues = {
  id: 'leg-day',
  name: 'Leg Day',
  category: 'Strength',
  level: 'Beginner',
  description: '',
  exercises: [{ ...NEW_EXERCISE, name: 'Squat', muscleGroup: 'Legs' }],
};

describe('validateTemplate', () => {
  it('accepts a complete template', () => {
    expect(hasErrors(validateTemplate(valid))).toBe(false);
  });

  it('names what is missing', () => {
    const errors = validateTemplate({
      ...valid,
      name: '  ',
      id: '',
      exercises: [],
    });
    expect(errors).toMatchObject({
      name: 'Enter a name',
      id: 'Enter an id',
      exercises: 'Add at least one exercise',
    });
    expect(hasErrors(errors)).toBe(true);
  });

  it('refuses ids the API refuses', () => {
    for (const id of ['Leg Day', 'custom-legs', 'form-check', '-legs']) {
      expect(validateTemplate({ ...valid, id }).id).toMatch(/lowercase/);
    }
    expect(validateTemplate({ ...valid, id: 'a'.repeat(65) }).id).toBe(
      'At most 64 characters',
    );
  });

  it('caps the list at 30 exercises', () => {
    const exercises = Array.from({ length: 31 }, () => valid.exercises[0]);
    expect(validateTemplate({ ...valid, exercises }).exercises).toBe(
      'At most 30 exercises',
    );
  });
});

describe('validateExercise', () => {
  const row = valid.exercises[0];

  it('checks the amount against the type', () => {
    expect(validateExercise({ ...row, amount: 300 }).amount).toBe('1–200 reps');
    expect(validateExercise({ ...row, mode: 'timed', amount: 300 })).toEqual(
      {},
    );
    expect(validateExercise({ ...row, mode: 'timed', amount: 0 }).amount).toBe(
      '1–3600 seconds',
    );
  });

  it('treats an emptied number field as missing', () => {
    expect(validateExercise({ ...row, sets: Number.NaN })).toEqual({
      sets: '1–20 sets',
    });
    expect(validateExercise({ ...row, weightKg: Number.NaN })).toEqual({
      weightKg: '0–500 kg',
    });
  });

  it('allows a fractional load but whole sets, reps and rest', () => {
    expect(validateExercise({ ...row, weightKg: 12.5 })).toEqual({});
    expect(validateExercise({ ...row, sets: 2.5, restSeconds: 30.5 })).toEqual({
      sets: '1–20 sets',
      restSeconds: '0–900 s',
    });
  });
});
