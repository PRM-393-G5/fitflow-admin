import { formatCount } from './tokens';

export interface TooltipRow {
  label: string;
  value: number;
  color: string;
}

/**
 * Hover readout: every series at that position, the value strong and the
 * series name secondary, each keyed by a short stroke of its colour.
 */
export function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="chart-tooltip">
      <div className="mb-1 text-xs text-muted">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="tabular-nums flex items-center gap-2">
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <strong className="font-semibold">{formatCount(row.value)}</strong>
          <span className="text-muted">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
