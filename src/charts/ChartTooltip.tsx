import { CHART, formatCount } from './tokens';

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
      <div className="chart-tooltip-title">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="chart-tooltip-row">
          <span
            className="chart-tooltip-key"
            style={{ backgroundColor: row.color }}
          />
          <strong style={{ color: CHART.inkPrimary }}>
            {formatCount(row.value)}
          </strong>
          <span style={{ color: CHART.inkSecondary }}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}
