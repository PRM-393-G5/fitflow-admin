import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useApi } from '../../auth/useAuth';
import type { AiUsageReport, StatsOverview } from './types';

/** The browser's time zone, so "today" is the admin's today. */
export const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const statsQuery = (days: number) =>
  new URLSearchParams({ days: String(days), tz: browserTimeZone() });

export function useOverview(days: number) {
  const api = useApi();
  return useQuery({
    queryKey: ['stats', 'overview', days],
    queryFn: () =>
      api.get<StatsOverview>(`admin/stats/overview?${statsQuery(days)}`),
    // Keep the previous range on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useAiUsage(days: number) {
  const api = useApi();
  return useQuery({
    queryKey: ['stats', 'ai', days],
    queryFn: () => api.get<AiUsageReport>(`admin/stats/ai?${statsQuery(days)}`),
    placeholderData: keepPreviousData,
  });
}
