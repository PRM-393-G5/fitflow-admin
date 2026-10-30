/**
 * Chart colours by role (the dataviz reference palette, light mode; the
 * admin web has no dark theme). Validated with the palette script: slots
 * 1–2 and slot 1 + critical clear every CVD and contrast check.
 */
export const CHART = {
  surface: '#fcfcfb',
  inkPrimary: '#0b0b0b',
  inkSecondary: '#52514e',
  inkMuted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  /** Categorical slot 1 (blue). */
  series1: '#2a78d6',
  /** Categorical slot 2 (orange). */
  series2: '#eb6834',
  /** Status: critical — only for failures, always labelled. */
  critical: '#d03b3b',
} as const;

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const whole = new Intl.NumberFormat('en');

/** 1,284 / 12.9K: exact below 10,000, compact above. */
export function formatCount(value: number): string {
  return Math.abs(value) < 10_000 ? whole.format(value) : compact.format(value);
}

/** Axis ticks: 0 / 500 / 1K / 2K. */
export const formatTick = (value: number) =>
  Math.abs(value) < 1000 ? String(value) : compact.format(value);

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** "27 Oct" for a `yyyy-mm-dd` day (no time-zone shift). */
export const formatDay = (day: string) =>
  dayFormat.format(new Date(`${day}T00:00:00Z`));
