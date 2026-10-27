import { Table } from '@heroui/react';
import type { ReactNode } from 'react';
import type { NavigateOptions } from 'react-router';
import { EmptyRows } from './feedback';

export interface Column<Row> {
  /** The header. */
  title: string;
  render: (row: Row) => ReactNode;
  /** Right-aligned, with tabular-nums figures. */
  numeric?: boolean;
  /** Extra classes for the column's cells. */
  className?: string;
  /** Names the row for screen readers; defaults to the first column. */
  rowHeader?: boolean;
}

/**
 * Rows under a header, the first column naming each row. A table inside
 * a card: no outer frame, a rounded header strip and row dividers.
 */
export function DataTable<Row>({
  label,
  rows,
  rowKey,
  columns,
  empty,
  className,
  contentClassName,
  scrollClassName,
  rowHref,
  rowRouterOptions,
  footer,
}: {
  /** The table's accessible name. */
  label: string;
  rows: Row[];
  rowKey: (row: Row) => string;
  columns: Column<Row>[];
  /** Shown instead of rows when there are none. */
  empty: ReactNode;
  className?: string;
  /** On the `<table>`, e.g. a `min-w-*` that scrolls on narrow screens. */
  contentClassName?: string;
  /** On the scroll container, e.g. a `max-h-*` that scrolls tall tables. */
  scrollClassName?: string;
  /**
   * Makes each row a link: a click anywhere opens it, and a Ctrl/⌘ click
   * opens a new tab. (A middle click works on links inside the row.)
   */
  rowHref?: (row: Row) => string;
  rowRouterOptions?: (row: Row) => NavigateOptions;
  footer?: ReactNode;
}) {
  const headerIndex = Math.max(
    0,
    columns.findIndex((column) => column.rowHeader),
  );
  return (
    <Table variant="secondary" className={className}>
      <Table.ScrollContainer className={scrollClassName}>
        <Table.Content aria-label={label} className={contentClassName}>
          <Table.Header>
            {columns.map((column, index) => (
              <Table.Column
                key={index}
                isRowHeader={index === headerIndex}
                className={column.numeric ? 'text-end' : undefined}
              >
                {column.title}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() =>
              typeof empty === 'string' ? <EmptyRows>{empty}</EmptyRows> : empty
            }
          >
            {rows.map((row) => (
              <Table.Row
                key={rowKey(row)}
                id={rowKey(row)}
                href={rowHref?.(row)}
                routerOptions={rowRouterOptions?.(row)}
                className={rowHref ? 'cursor-pointer' : undefined}
              >
                {columns.map((column, index) => (
                  <Table.Cell
                    key={index}
                    className={[
                      column.numeric && 'tabular-nums text-end',
                      column.className,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.render(row)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      {footer && <Table.Footer>{footer}</Table.Footer>}
    </Table>
  );
}
