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

/** The narrow-sidebar form: one button that steps through the modes. */
export function ThemeCycleButton() {
  const { mode, setMode } = useTheme();
  const index = OPTIONS.findIndex((option) => option.value === mode);
  const current = OPTIONS[index];
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={`${current.label}. Switch to ${next.label.toLowerCase()}`}
      onPress={() => setMode(next.value)}
    >
      <current.Icon />
    </Button>
  );
}
