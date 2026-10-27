import { formatDay } from '../../charts/tokens';
import { Segmented } from '../../ui/Segmented';
import { RANGE_DAYS } from './range';
import type { StatsRange } from './types';

/**
 * The one filter row: it scopes every number and chart below it. The
 * dates shown are the report's, dimmed with it while the next one loads.
 */
export function RangeBar({
  days,
  onChange,
  range,
  isStale,
}: {
  days: number;
  onChange: (days: number) => void;
  range: StatsRange | undefined;
  isStale: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Segmented<number>
        ariaLabel="Date range"
        size="md"
        value={days}
        onChange={onChange}
        options={RANGE_DAYS.map((value) => ({
          value,
          label: `Last ${value} days`,
        }))}
      />
      {range && (
        <span
          className={`text-sm text-muted transition-opacity duration-200 ${isStale ? 'opacity-55' : ''}`}
        >
          {formatDay(range.from)} – {formatDay(range.to)} · {range.tz}
        </span>
      )}
    </div>
  );
}
