const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const integer = new Intl.NumberFormat('en');

/** "12,345": every digit, for exact counts (charts use formatCount). */
export const formatExact = (value: number) => integer.format(value);

/** "27 Oct 2026, 18:05" in the browser's time zone. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTime.format(date);
}
