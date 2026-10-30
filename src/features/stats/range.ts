import { useSearchParams } from 'react-router';

export const RANGE_DAYS = [7, 30, 90] as const;
export const DEFAULT_DAYS = 30;

/** `?days=` from the URL: one of [RANGE_DAYS], else 30. */
export function useRangeDays(): [number, (days: number) => void] {
  const [params, setParams] = useSearchParams();
  const asked = Number(params.get('days'));
  const days = (RANGE_DAYS as readonly number[]).includes(asked)
    ? asked
    : DEFAULT_DAYS;
  const setDays = (next: number) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === DEFAULT_DAYS) updated.delete('days');
        else updated.set('days', String(next));
        return updated;
      },
      { replace: true },
    );
  return [days, setDays];
}
