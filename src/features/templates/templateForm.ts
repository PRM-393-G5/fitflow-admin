import { assignExerciseIds } from './ids';
import type { Template, TemplateExercise, TemplateInput } from './types';

/** One exercise row of the editor. */
export interface ExerciseFormValues {
  /** Kept for existing exercises; new ones get an id on save. */
  id?: string;
  name: string;
  muscleGroup: string;
  sets: number;
  mode: 'reps' | 'timed';
  /** Reps per set, or seconds per set when timed. */
  amount: number;
  restSeconds: number;
  weightKg: number;
}

export interface TemplateFormValues {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string;
  exercises: ExerciseFormValues[];
}

export const NEW_EXERCISE: ExerciseFormValues = {
  name: '',
  muscleGroup: '',
  sets: 3,
  mode: 'reps',
  amount: 10,
  restSeconds: 60,
  weightKg: 0,
};

export function toFormValues(template: Template): TemplateFormValues {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    level: template.level,
    description: template.description,
    exercises: template.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets,
      mode: exercise.durationSeconds > 0 ? 'timed' : 'reps',
      amount:
        exercise.durationSeconds > 0 ? exercise.durationSeconds : exercise.reps,
      restSeconds: exercise.restSeconds,
      weightKg: exercise.weightKg,
    })),
  };
}

/** The sets, reps or hold, and rest of an editor row, as the API has them. */
export function workOf(exercise: ExerciseFormValues) {
  const timed = exercise.mode === 'timed';
  return {
    sets: exercise.sets,
    reps: timed ? 0 : exercise.amount,
    durationSeconds: timed ? exercise.amount : 0,
    restSeconds: exercise.restSeconds,
  };
}

export function fromFormValues(values: TemplateFormValues): TemplateInput {
  const ids = assignExerciseIds(values.exercises);
  const exercises: TemplateExercise[] = values.exercises.map(
    (exercise, index) => ({
      id: ids[index],
      name: exercise.name.trim(),
      muscleGroup: exercise.muscleGroup.trim(),
      ...workOf(exercise),
      weightKg: exercise.weightKg,
    }),
  );
  return {
    id: values.id,
    name: values.name.trim(),
    category: values.category,
    level: values.level,
    description: values.description.trim(),
    durationMinutes: estimateMinutes(exercises),
    exercises,
  };
}

/**
 * The app's `estimateWorkoutDuration`: each set is its hold time (or ~3 s
 * per rep, 20–600 s) plus the rest after it, rounded up to whole minutes
 * (1–600). The app shows this, not a typed-in duration.
 */
export function estimateMinutes(
  exercises: Array<
    Pick<TemplateExercise, 'sets' | 'reps' | 'durationSeconds' | 'restSeconds'>
  >,
): number {
  const seconds = exercises.reduce((total, exercise) => {
    const work =
      exercise.durationSeconds > 0
        ? exercise.durationSeconds
        : Math.min(Math.max(exercise.reps * 3, 20), 600);
    return total + exercise.sets * (work + exercise.restSeconds);
  }, 0);
  return Math.min(Math.max(Math.ceil(seconds / 60), 1), 600);
}
