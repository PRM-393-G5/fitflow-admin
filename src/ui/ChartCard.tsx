import { useState, type ReactNode } from 'react';
import { SectionCard } from './SectionCard';
import { Segmented } from './Segmented';

/**
 * A chart with its table twin (the accessible view of the same numbers).
 * The page dims it, with everything else, while a new range loads.
 */
export function ChartCard({
  title,
  description,
  chart,
  table,
}: {
  title: string;
  description?: string;
  chart: ReactNode;
  table: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <SectionCard
      title={title}
      description={description}
      actions={
        <Segmented
          ariaLabel={`${title}: view`}
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Chart' },
            { value: 'table', label: 'Table' },
          ]}
        />
      }
    >
      {view === 'chart' ? chart : table}
    </SectionCard>
  );
}
