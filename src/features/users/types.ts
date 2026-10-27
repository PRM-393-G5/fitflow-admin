/** An app account in the list (`GET /api/admin/users`). */
export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  /** Locked by an admin. */
  disabled: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  /** Finished workouts (form checks not counted). */
  sessionCount: number;
}

export interface UserPage {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
}

export const USER_STATUSES = ['all', 'active', 'locked'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface UserQuery {
  search: string;
  status: UserStatus;
  page: number;
  limit: number;
}

export interface RecentSession {
  id: string;
  workoutName: string | null;
  /** As the phone wrote it: usually local time without an offset. */
  completedAt: string | null;
  minutes: number;
  completedSets: number;
  volumeKg: number;
  formCheck: boolean;
}

/** The app's synced profile; null fields were never set. */
export interface TrainingProfile {
  goal: string | null;
  level: string | null;
  weeklyGoal: number | null;
  heightCm: number | null;
  age: number | null;
  isMale: boolean | null;
  activityLevel: number | string | null;
}

export interface UserDetail extends UserSummary {
  profile: TrainingProfile | null;
  counts: {
    sessions: number;
    formChecks: number;
    workouts: number;
    weights: number;
    meals: number;
  };
  totals: { minutes: number; volumeKg: number };
  latestWeightKg: number | null;
  lastSyncAt: string | null;
  recentSessions: RecentSession[];
}
