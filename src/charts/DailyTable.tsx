import { DataTable } from '../ui/DataTable';
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
    <DataTable
      label={label}
      rows={[...rows].reverse()}
      rowKey={(row) => row.date}
      // Tall ranges scroll under a header that stays put.
      scrollClassName="max-h-80 overflow-y-auto [&_th]:sticky [&_th]:top-0 [&_th]:z-10"
      empty="No days in this range"
      columns={[
        { title: 'Day', render: (row) => formatDay(row.date) },
        ...columns.map(([key, title]) => ({
          title,
          numeric: true,
          render: (row: Row) => formatCount(Number(row[key])),
        })),
      ]}
    />
  );
}
