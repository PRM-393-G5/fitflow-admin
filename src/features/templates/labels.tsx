import { Chip } from '@heroui/react';

type ChipColor = 'default' | 'accent' | 'success' | 'warning' | 'danger';

const CATEGORY_COLORS: Record<string, ChipColor> = {
  Strength: 'accent',
  Cardio: 'warning',
  Mobility: 'success',
};

const LEVEL_COLORS: Record<string, ChipColor> = {
  Beginner: 'default',
  Intermediate: 'warning',
  Advanced: 'danger',
};

export function CategoryChip({ category }: { category: string }) {
  return (
    <Chip
      size="sm"
      variant="soft"
      color={CATEGORY_COLORS[category] ?? 'default'}
    >
      <Chip.Label>{category}</Chip.Label>
    </Chip>
  );
}

export function LevelChip({ level }: { level: string }) {
  return (
    <Chip
      size="sm"
      variant="secondary"
      color={LEVEL_COLORS[level] ?? 'default'}
    >
      <Chip.Label>{level}</Chip.Label>
    </Chip>
  );
}
