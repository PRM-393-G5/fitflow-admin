import { Table } from '@heroui/react';
import { formatCount, formatDay } from './tokens';

/** The table twin of a per-day chart, newest day first. */
export function DailyTable<Row extends { date: string }>({
  rows,
  columns,
  label,
}: {
  rows: Row[];
  columns: Array<[keyof Row & string, string]>;
  label: string;
}) {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer className="max-h-80 overflow-y-auto">
        <Table.Content aria-label={label}>
          <Table.Header>
            <Table.Column isRowHeader>Day</Table.Column>
            {columns.map(([key, title]) => (
              <Table.Column key={key} className="text-end">
                {title}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {[...rows].reverse().map((row) => (
              <Table.Row key={row.date} id={row.date}>
                <Table.Cell>{formatDay(row.date)}</Table.Cell>
                {columns.map(([key]) => (
                  <Table.Cell key={key} className="tabular text-end">
                    {formatCount(Number(row[key]))}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
