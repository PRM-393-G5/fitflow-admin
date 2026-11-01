import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { formatDay, formatTick, useChartTokens } from './tokens';

export interface DailySeries<Row> {
  key: keyof Row & string;
  label: string;
  color: string;
}

/**
 * Columns per day from one baseline: thin (≤ 24px), a 4px rounded top on
 * whichever series is on top that day, stacked series split by a 2px
 * surface gap. A legend
 * appears from two series on; one series is named by the card's title.
 */
export function DailyBarChart<Row extends { date: string }>({
  data,
  series,
  height = 240,
}: {
  data: Row[];
  series: DailySeries<Row>[];
  height?: number;
}) {
  const CHART = useChartTokens();
  const stacked = series.length > 1;
  /** Whether series [index] is the visible top of the column for [row]. */
  const isTop = (row: Row, index: number) =>
    series
      .slice(index + 1)
      .every((above) => !Number(row[above.key as keyof Row]));
  return (
    <figure className="m-0">
      {stacked && (
        <figcaption className="mb-3 flex flex-wrap gap-4 text-sm text-muted">
          {series.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </figcaption>
      )}
      {/* The height includes the x-axis band, so the card never scrolls. */}
      <ResponsiveContainer width="100%" height={height}>
        {/* The right margin keeps the last day's label from being cut. */}
        <BarChart
          data={data}
          margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: CHART.inkMuted, fontSize: 12 }}
            axisLine={{ stroke: CHART.axis }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatTick}
            tick={{ fill: CHART.inkMuted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: CHART.cursor }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltip
                  title={formatDay(String(label))}
                  rows={series.map((item) => ({
                    label: item.label,
                    color: item.color,
                    value: Number(
                      payload.find((entry) => entry.dataKey === item.key)
                        ?.value ?? 0,
                    ),
                  }))}
                />
              ) : null
            }
          />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key as string}
              name={item.label}
              stackId="day"
              fill={item.color}
              maxBarSize={24}
              // The 2px gap between stacked segments, in the surface colour.
              stroke={stacked ? CHART.surface : undefined}
              strokeWidth={stacked ? 2 : 0}
              shape={(props: BarShapeProps) => (
                <Rectangle
                  {...props}
                  radius={isTop(props.payload as Row, index) ? [4, 4, 0, 0] : 0}
                />
              )}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
