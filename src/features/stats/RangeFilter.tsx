import { Segmented } from 'antd';
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
      value={days}
      onChange={onChange}
      aria-label="Date range"
      options={RANGE_DAYS.map((value) => ({
        label: `Last ${value} days`,
        value,
      }))}
    />
  );
}
