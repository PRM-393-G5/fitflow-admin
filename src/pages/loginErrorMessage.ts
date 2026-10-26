import { ApiError } from '../api/client';

/** What a failed login means for the admin. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Wrong email or password.';
    if (error.status === 429) {
      return 'Too many attempts. Wait a minute, then try again.';
    }
    if (error.status === 0) {
      return 'Cannot reach the FitFlow API. Is it running?';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
