import { Segmented } from '../../ui/Segmented';
import { RANGE_DAYS } from './range';

/** The one filter row: it scopes every number and chart below it. */
export function RangeFilter({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
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
  );
}
