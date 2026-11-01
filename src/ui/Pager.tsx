import { Pagination } from '@heroui/react';
import { formatExact } from '../format';
import { pageItems } from './pages';

/** "21–40 of 132" and the page links; [page] counts from 1. */
export function Pager({
  page,
  pageSize,
  total,
  onChange,
  noun = 'results',
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  noun?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <Pagination size="sm" className="w-full">
      <Pagination.Summary className="tabular">
        {formatExact(first)}–{formatExact(last)} of {formatExact(total)} {noun}
      </Pagination.Summary>
      {pageCount > 1 && (
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              aria-label="Previous page"
              isDisabled={page <= 1}
              onPress={() => onChange(page - 1)}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          {pageItems(page, pageCount).map((item, index) =>
            item === 'gap' ? (
              <Pagination.Item key={`gap-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={item}>
                <Pagination.Link
                  aria-label={`Page ${item}`}
                  isActive={item === page}
                  onPress={() => onChange(item)}
                >
                  {item}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next
              aria-label="Next page"
              isDisabled={page >= pageCount}
              onPress={() => onChange(page + 1)}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      )}
    </Pagination>
  );
}
