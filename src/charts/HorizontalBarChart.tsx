import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { formatCount, useChartTokens } from './tokens';

export interface LabelledValue {
  label: string;
  value: number;
}

/**
 * One series of named bars (a single colour for every bar: the categories
 * have no order), each labelled with its value at the tip.
 */
export function HorizontalBarChart({
  data,
  valueLabel,
}: {
  data: LabelledValue[];
  valueLabel: string;
}) {
  const CHART = useChartTokens();
  const rowHeight = 36;
  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(data.length, 1) * rowHeight + 16}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 48, bottom: 8, left: 0 }}
      >
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fill: CHART.inkSecondary, fontSize: 13 }}
          axisLine={{ stroke: CHART.axis }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CHART.cursor }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(payload[0].payload.label)}
                rows={[
                  {
                    label: valueLabel,
                    value: Number(payload[0].value ?? 0),
                    color: CHART.series1,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="value"
          fill={CHART.series1}
          maxBarSize={24}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value) => formatCount(Number(value))}
            fill={CHART.inkPrimary}
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
