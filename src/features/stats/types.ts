export interface StatsRange {
  days: number;
  tz: string;
  from: string;
  to: string;
}

export interface DailyActivity {
  date: string;
  newUsers: number;
  sessions: number;
  formChecks: number;
  aiCalls: number;
  aiErrors: number;
}

/** `GET /api/admin/stats/overview` */
export interface StatsOverview {
  range: StatsRange;
  users: { total: number; locked: number; new: number; active: number };
  sessions: {
    total: number;
    inRange: number;
    minutesInRange: number;
    formChecksInRange: number;
  };
  ai: { calls: number; errors: number };
  templates: number;
  daily: DailyActivity[];
}

export type AiFeature =
  'generate' | 'workout-plan' | 'meal-plan' | 'food-photo' | 'form-review';

export interface AiUsageUser {
  id: string;
  /** Null once the account is deleted. */
  email: string | null;
  name: string | null;
}

/** `GET /api/admin/stats/ai` */
export interface AiUsageReport {
  range: StatsRange;
  status: { configured: boolean; model: string };
  totals: {
    calls: number;
    errors: number;
    users: number;
    /** Calls from accounts deleted since. */
    anonymousCalls: number;
    avgDurationMs: number;
  };
  byFeature: Array<{
    feature: AiFeature;
    calls: number;
    errors: number;
    avgDurationMs: number;
  }>;
  daily: Array<{ date: string; calls: number; errors: number }>;
  errorsByCode: Array<{ code: string; count: number }>;
  topUsers: Array<AiUsageUser & { calls: number }>;
  recent: Array<{
    id: string;
    createdAt: string;
    feature: AiFeature;
    ok: boolean;
    errorCode: string | null;
    durationMs: number;
    model: string;
    user: AiUsageUser | null;
  }>;
}
