/** The app's goal labels (`trainingGoals`), keyed by the stored value. */
const GOALS: Record<string, string> = {
  Strength: 'Build muscle',
  Cardio: 'Lose fat',
  Mobility: 'Stay mobile',
};

/** The app's `activityLevels`, indexed by the stored number. */
const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Athlete'];

export const goalLabel = (goal: string) => GOALS[goal] ?? goal;

export function activityLabel(level: number | string): string {
  if (typeof level === 'string') return level;
  if (!Number.isFinite(level)) return '—';
  const index = Math.min(Math.max(Math.round(level), 0), 4);
  return ACTIVITY_LEVELS[index];
}

export const sexLabel = (isMale: boolean) => (isMale ? 'Male' : 'Female');

/** "1,234.5 kg" */
export const formatKg = (kg: number) =>
  `${kg.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg`;

/** "2 h 5 min" / "45 min" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
