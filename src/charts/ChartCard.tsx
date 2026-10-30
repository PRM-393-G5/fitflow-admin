import { Card, Segmented } from 'antd';
import { useState, type ReactNode } from 'react';

/**
 * A chart with its table twin (the accessible view of the same numbers).
 * The page dims it, with everything else, while a new range loads.
 */
export function ChartCard({
  title,
  chart,
  table,
}: {
  title: string;
  chart: ReactNode;
  table: ReactNode;
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
      {view === 'chart' ? chart : table}
    </Card>
  );
}
