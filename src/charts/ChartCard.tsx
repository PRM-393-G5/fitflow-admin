import { Card, Segmented } from 'antd';
import { useState, type ReactNode } from 'react';

/**
 * A chart with its table twin (the accessible view of the same numbers).
 * While new data loads, the previous render stays, dimmed, instead of a
 * skeleton.
 */
export function ChartCard({
  title,
  chart,
  table,
  refreshing = false,
}: {
  title: string;
  chart: ReactNode;
  table: ReactNode;
  refreshing?: boolean;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <Card
      title={title}
      extra={
        <Segmented
          size="small"
          value={view}
          onChange={setView}
          aria-label={`${title}: view`}
          options={[
            { label: 'Chart', value: 'chart' },
            { label: 'Table', value: 'table' },
          ]}
        />
      }
    >
      <div
        style={{ opacity: refreshing ? 0.55 : 1, transition: 'opacity 0.2s' }}
      >
        {view === 'chart' ? chart : table}
      </div>
    </Card>
  );
}
