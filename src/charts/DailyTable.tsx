import { Table } from 'antd';
import { formatCount, formatDay } from './tokens';

/** The table twin of a per-day chart, newest day first. */
export function DailyTable<Row extends { date: string }>({
  rows,
  columns,
}: {
  rows: Row[];
  columns: Array<[keyof Row & string, string]>;
}) {
  return (
    <Table<Row>
      size="small"
      rowKey="date"
      dataSource={[...rows].reverse()}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      columns={[
        {
          title: 'Day',
          dataIndex: 'date',
          render: (day: string) => formatDay(day),
        },
        ...columns.map(([key, title]) => ({
          title,
          dataIndex: key,
          align: 'right' as const,
          className: 'tabular',
          render: (value: number) => formatCount(value),
        })),
      ]}
    />
  );
}
