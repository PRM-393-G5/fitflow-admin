import { Card } from '@heroui/react';
import { useState, type ReactNode } from 'react';
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
    <Card className="h-full">
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <Card.Title>{title}</Card.Title>
          {description && <Card.Description>{description}</Card.Description>}
        </div>
        <Segmented
          ariaLabel={`${title}: view`}
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Chart' },
            { value: 'table', label: 'Table' },
          ]}
        />
      </Card.Header>
      <Card.Content>{view === 'chart' ? chart : table}</Card.Content>
    </Card>
  );
}
