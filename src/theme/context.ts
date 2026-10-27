import { createContext, useContext } from 'react';
import type { ResolvedTheme, ThemeMode } from './mode';

export interface ThemeValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  resolved: 'light',
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);
