/** One exercise of a template, as the API and the app store it. */
export interface TemplateExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  /** Reps per set; 0 for a timed exercise. */
  reps: number;
  /** Seconds per set; 0 for a rep-based exercise. */
  durationSeconds: number;
  restSeconds: number;
  weightKg: number;
}

/** A public workout template (`/api/admin/templates`). */
export interface Template {
  id: string;
  name: string;
  durationMinutes: number;
  level: string;
  category: string;
  description: string;
  exercises: TemplateExercise[];
  /** Null for templates written without timestamps. */
  updatedAt: string | null;
}

export type TemplateInput = Omit<Template, 'updatedAt'>;

/** What the app's filters and builder offer (the API enforces these). */
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const CATEGORIES = ['Strength', 'Cardio', 'Mobility'] as const;

/** The app's muscle-group picker (`workoutMuscleGroups`); others allowed. */
export const MUSCLE_GROUPS = [
  'Legs',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Full body',
  'Cardio',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Strength: 'blue',
  Cardio: 'orange',
  Mobility: 'green',
};

export const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'default',
  Intermediate: 'gold',
  Advanced: 'red',
};
