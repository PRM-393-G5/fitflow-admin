import type { AiFeature } from './types';

/** What each AI route does in the app. */
export const FEATURE_LABELS: Record<AiFeature, string> = {
  'workout-plan': 'Workout generator',
  'meal-plan': 'Meal plan',
  'food-photo': 'Food photo',
  'form-review': 'Form review',
  generate: 'Other (structured JSON)',
};

/** The error codes the app shows, explained for the admin. */
const ERROR_LABELS: Record<string, string> = {
  'not-configured': 'No OpenAI key on the server',
  unauthorized: 'OpenAI rejected the key',
  'rate-limited': 'OpenAI rate limit',
  'server-error': 'OpenAI server error',
  timeout: 'Timed out',
  offline: 'OpenAI unreachable',
  refused: 'Model refused',
  'too-long': 'Answer cut off',
  'invalid-response': 'Unreadable answer',
  internal: 'API error',
};

/** The admin's wording for a failure code; a missing code is "Unknown". */
export const errorLabel = (code: string | null) =>
  code === null || code === 'unknown'
    ? 'Unknown error'
    : (ERROR_LABELS[code] ?? code);
