import { MAX_TEMPLATE_ID_LENGTH, TEMPLATE_ID_PATTERN } from './ids';
import type { ExerciseFormValues, TemplateFormValues } from './templateForm';

export const MAX_EXERCISES = 30;
export const MAX_DESCRIPTION = 500;

export type ExerciseErrors = Partial<
  Record<Exclude<keyof ExerciseFormValues, 'id' | 'mode'>, string>
>;

export interface TemplateErrors {
  name?: string;
  id?: string;
  description?: string;
  /** About the list itself: too few or too many exercises. */
  exercises?: string;
  /** One entry per exercise row, in order. */
  rows: ExerciseErrors[];
}

const isWhole = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

const isBetween = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

/** The amount's range for the row's type, as the API checks it. */
export const amountRange = (mode: ExerciseFormValues['mode']) =>
  mode === 'timed'
    ? { min: 1, max: 3600, message: '1–3600 seconds' }
    : { min: 1, max: 200, message: '1–200 reps' };

export function validateExercise(exercise: ExerciseFormValues): ExerciseErrors {
  const errors: ExerciseErrors = {};
  const name = exercise.name.trim();
  if (!name) errors.name = 'Enter a name';
  else if (name.length > 80) errors.name = 'At most 80 characters';
  const group = exercise.muscleGroup.trim();
  if (!group) errors.muscleGroup = 'Pick a group';
  else if (group.length > 40) errors.muscleGroup = 'At most 40 characters';
  if (!isWhole(exercise.sets, 1, 20)) errors.sets = '1–20 sets';
  const amount = amountRange(exercise.mode);
  if (!isWhole(exercise.amount, amount.min, amount.max)) {
    errors.amount = amount.message;
  }
  if (!isWhole(exercise.restSeconds, 0, 900)) errors.restSeconds = '0–900 s';
  if (!isBetween(exercise.weightKg, 0, 500)) errors.weightKg = '0–500 kg';
  return errors;
}

/** Every rule the API enforces, worded for the form. */
export function validateTemplate(values: TemplateFormValues): TemplateErrors {
  const errors: TemplateErrors = {
    rows: values.exercises.map(validateExercise),
  };
  const name = values.name.trim();
  if (!name) errors.name = 'Enter a name';
  else if (name.length > 80) errors.name = 'At most 80 characters';
  if (!values.id) errors.id = 'Enter an id';
  else if (values.id.length > MAX_TEMPLATE_ID_LENGTH) {
    errors.id = `At most ${MAX_TEMPLATE_ID_LENGTH} characters`;
  } else if (!TEMPLATE_ID_PATTERN.test(values.id)) {
    errors.id =
      'Use lowercase words joined by “-”, not starting with “custom-”';
  }
  if (values.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `At most ${MAX_DESCRIPTION} characters`;
  }
  if (values.exercises.length === 0)
    errors.exercises = 'Add at least one exercise';
  if (values.exercises.length > MAX_EXERCISES) {
    errors.exercises = `At most ${MAX_EXERCISES} exercises`;
  }
  return errors;
}

export function hasErrors(errors: TemplateErrors): boolean {
  return (
    Boolean(
      errors.name || errors.id || errors.description || errors.exercises,
    ) || errors.rows.some((row) => Object.keys(row).length > 0)
  );
}
