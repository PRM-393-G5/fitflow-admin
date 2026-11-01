import { Display, Moon, Sun } from '@gravity-ui/icons';
import { Button } from '@heroui/react';
import { Segmented } from '../ui/Segmented';
import { useTheme } from './context';
import type { ThemeMode } from './mode';

const OPTIONS: Array<{ value: ThemeMode; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'system', label: 'Same as the system', Icon: Display },
];

/** Light, dark or follow the OS; remembered in this browser. */
export function ThemeSwitch({ fullWidth = false }: { fullWidth?: boolean }) {
  const { mode, setMode } = useTheme();
  return (
    <Segmented<ThemeMode>
      ariaLabel="Theme"
      iconOnly
      fullWidth={fullWidth}
      value={mode}
      onChange={setMode}
      options={OPTIONS.map(({ value, label, Icon }) => ({
        value,
        ariaLabel: label,
        label: <Icon />,
      }))}
    />
  );
}

/**
 * The narrow-sidebar and sign-in form: one button that flips to the
 * other look (every press changes something; "system" lives in the full
 * switch).
 */
export function ThemeCycleButton() {
  const { resolved, setMode } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  const Icon = resolved === 'dark' ? Moon : Sun;
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={`Switch to ${next} theme`}
      onPress={() => setMode(next)}
    >
      <Icon />
    </Button>
  );
}
