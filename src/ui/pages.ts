export type PageItem = number | 'gap';

/**
 * The page numbers to show: always the first, the last and the
 * current page with its neighbours; skipped runs become one gap.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1]);
  const items: PageItem[] = [];
  for (let n = 1; n <= pageCount; n += 1) {
    if (shown.has(n)) items.push(n);
    // A single hidden page is shown rather than replaced by a gap.
    else if (shown.has(n - 1) && shown.has(n + 1)) items.push(n);
    else if (items.at(-1) !== 'gap') items.push('gap');
  }
  return items;
}
