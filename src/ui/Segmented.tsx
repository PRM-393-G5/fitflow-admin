import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import type { ReactNode } from 'react';

type Key = string | number;

export interface SegmentedOption<T extends Key> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is only an icon. */
  ariaLabel?: string;
}

/** One-of-n choice (a range, a view) as a joined group of toggle buttons. */
export function Segmented<T extends Key>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'sm',
  iconOnly = false,
  fullWidth = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  ariaLabel: string;
  size?: 'sm' | 'md';
  iconOnly?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      selectionMode="single"
      disallowEmptySelection
      size={size}
      fullWidth={fullWidth}
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (next !== undefined) onChange(next as T);
      }}
    >
      {options.map((option, index) => (
        <ToggleButton
          key={option.value}
          id={option.value}
          isIconOnly={iconOnly}
          aria-label={option.ariaLabel}
        >
          {index > 0 && <ToggleButtonGroup.Separator />}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
