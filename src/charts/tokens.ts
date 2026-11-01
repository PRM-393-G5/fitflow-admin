import { formatExact } from '../format';
import { useTheme } from '../theme/context';

/**
 * Chart colours by role (the dataviz reference palette), one set per
 * theme: the dark steps are chosen for the dark surface, not inverted.
 * Validated on HeroUI's surfaces: slots 1–2 and slot 1 + critical clear
 * every CVD, lightness and contrast check in both themes.
 */
export interface ChartTokens {
  surface: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  grid: string;
  axis: string;
  cursor: string;
  /** Categorical slot 1 (blue). */
  series1: string;
  /** Categorical slot 2 (orange). */
  series2: string;
  /** Status: critical — only for failures, always labelled. */
  critical: string;
}

const LIGHT: ChartTokens = {
  surface: '#ffffff',
  inkPrimary: '#18181b',
  inkSecondary: '#52525b',
  inkMuted: '#71717a',
  grid: '#e4e4e7',
  axis: '#d4d4d8',
  cursor: 'rgba(24, 24, 27, 0.05)',
  series1: '#2a78d6',
  series2: '#eb6834',
  critical: '#d03b3b',
};

const DARK: ChartTokens = {
  surface: '#18181b',
  inkPrimary: '#f4f4f5',
  inkSecondary: '#d4d4d8',
  inkMuted: '#a1a1aa',
  grid: '#27272a',
  axis: '#3f3f46',
  cursor: 'rgba(255, 255, 255, 0.06)',
  series1: '#3987e5',
  series2: '#d95926',
  critical: '#d03b3b',
};

/** The chart colours for the current theme. */
export const useChartTokens = () =>
  useTheme().resolved === 'dark' ? DARK : LIGHT;

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 1,284 / 12.9K: exact below 10,000, compact above. */
export function formatCount(value: number): string {
  return Math.abs(value) < 10_000 ? formatExact(value) : compact.format(value);
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
