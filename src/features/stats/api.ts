import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useApi } from '../../auth/useAuth';
import type { AiUsageReport, StatsOverview } from './types';

/** The browser's time zone, so "today" is the admin's today. */
export const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const statsQuery = (days: number, tz: string) =>
  new URLSearchParams({ days: String(days), tz });

export function useOverview(days: number) {
  const api = useApi();
  const tz = browserTimeZone();
  return useQuery({
    // Days depend on the zone: a new zone is a new report.
    queryKey: ['stats', 'overview', days, tz],
    queryFn: () =>
      api.get<StatsOverview>(`admin/stats/overview?${statsQuery(days, tz)}`),
    // Keep the previous range on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useAiUsage(days: number) {
  const api = useApi();
  const tz = browserTimeZone();
  return useQuery({
    queryKey: ['stats', 'ai', days, tz],
    queryFn: () =>
      api.get<AiUsageReport>(`admin/stats/ai?${statsQuery(days, tz)}`),
    placeholderData: keepPreviousData,
  });
}
