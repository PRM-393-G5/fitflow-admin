import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './context';
import {
  applyTheme,
  loadThemeMode,
  resolveTheme,
  saveThemeMode,
  systemPrefersDark,
  type ThemeMode,
} from './mode';

/** Light, dark or the system's choice, remembered in localStorage. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadThemeMode);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const resolved = resolveTheme(mode, prefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPrefersDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => applyTheme(resolved), [resolved]);

  const value = useMemo(
    () => ({
      mode,
      resolved,
      setMode: (next: ThemeMode) => {
        saveThemeMode(next);
        setModeState(next);
      },
    }),
    [mode, resolved],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}
