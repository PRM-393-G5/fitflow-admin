export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** Also read by the pre-paint script in index.html: keep the two in step. */
export const THEME_KEY = 'fitflow-admin.theme';

export function loadThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // Storage blocked: follow the system.
  }
  return 'system';
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Not persisted; still applied for this visit.
  }
}

export const systemPrefersDark = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export function resolveTheme(
  mode: ThemeMode,
  prefersDark: boolean,
): ResolvedTheme {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}

/** HeroUI reads the theme from the root's class and data-theme. */
export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.dataset.theme = theme;
}
