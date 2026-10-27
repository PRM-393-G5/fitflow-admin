import { CircleCheck, Lock } from '@gravity-ui/icons';
import { Chip } from '@heroui/react';

/** Active or locked, as a coloured chip with an icon and a word. */
export function StatusTag({
  disabled,
  size = 'sm',
}: {
  disabled: boolean;
  size?: 'sm' | 'md';
}) {
  return disabled ? (
    <Chip size={size} color="danger" variant="soft">
      <Lock className="size-3" />
      <Chip.Label>Locked</Chip.Label>
    </Chip>
  ) : (
    <Chip size={size} color="success" variant="soft">
      <CircleCheck className="size-3" />
      <Chip.Label>Active</Chip.Label>
    </Chip>
  );
}
