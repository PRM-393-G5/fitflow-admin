import { MAX_TEMPLATE_ID_LENGTH, TEMPLATE_ID_PATTERN } from './ids';
import type { ExerciseFormValues, TemplateFormValues } from './templateForm';

export const MAX_EXERCISES = 30;
export const MAX_DESCRIPTION = 500;
export const MAX_NAME = 80;
export const MAX_MUSCLE_GROUP = 40;

/** The API's limits for an exercise's numbers; the fields use them too. */
export const LIMITS = {
  sets: { min: 1, max: 20, message: '1–20 sets' },
  reps: { min: 1, max: 200, message: '1–200 reps' },
  timed: { min: 1, max: 3600, message: '1–3600 seconds' },
  restSeconds: { min: 0, max: 900, message: '0–900 s' },
  weightKg: { min: 0, max: 500, message: '0–500 kg' },
} as const;

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

/** [amount] moved into [mode]'s range, e.g. 300 s switched to reps → 200. */
export function amountFor(mode: ExerciseFormValues['mode'], amount: number) {
  const { min, max } = amountRange(mode);
  return Number.isFinite(amount)
    ? Math.min(Math.max(amount, min), max)
    : amount;
}

/** The amount's range for the row's type, as the API checks it. */
export const amountRange = (mode: ExerciseFormValues['mode']) =>
  mode === 'timed' ? LIMITS.timed : LIMITS.reps;

export function validateExercise(exercise: ExerciseFormValues): ExerciseErrors {
  const errors: ExerciseErrors = {};
  const name = exercise.name.trim();
  if (!name) errors.name = 'Enter a name';
  else if (name.length > MAX_NAME) {
    errors.name = `At most ${MAX_NAME} characters`;
  }
  const group = exercise.muscleGroup.trim();
  if (!group) errors.muscleGroup = 'Pick a group';
  else if (group.length > MAX_MUSCLE_GROUP) {
    errors.muscleGroup = `At most ${MAX_MUSCLE_GROUP} characters`;
  }
  const whole = (value: number, limit: (typeof LIMITS)[keyof typeof LIMITS]) =>
    isWhole(value, limit.min, limit.max) ? undefined : limit.message;
  errors.sets = whole(exercise.sets, LIMITS.sets);
  errors.amount = whole(exercise.amount, amountRange(exercise.mode));
  errors.restSeconds = whole(exercise.restSeconds, LIMITS.restSeconds);
  if (!isBetween(exercise.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max)) {
    errors.weightKg = LIMITS.weightKg.message;
  }
  // Only the problems, so an empty object means a valid row.
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message),
  ) as ExerciseErrors;
}

/**
 * Every rule the API enforces, worded for the form. The id is checked
 * only for a new template: an edit never sends it.
 */
export function validateTemplate(
  values: TemplateFormValues,
  { isNew = true }: { isNew?: boolean } = {},
): TemplateErrors {
  const errors: TemplateErrors = {
    rows: values.exercises.map(validateExercise),
  };
  const name = values.name.trim();
  if (!name) errors.name = 'Enter a name';
  else if (name.length > MAX_NAME) {
    errors.name = `At most ${MAX_NAME} characters`;
  }
  if (!isNew) {
    // Stored ids are whatever the API accepted; not ours to re-judge.
  } else if (!values.id) errors.id = 'Enter an id';
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
