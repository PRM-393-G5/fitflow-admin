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

function LabelChip({
  label,
  colors,
  variant,
}: {
  label: string;
  colors: Record<string, ChipColor>;
  variant: 'soft' | 'secondary';
}) {
  return (
    <Chip size="sm" variant={variant} color={colors[label] ?? 'default'}>
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
}

export const CategoryChip = ({ category }: { category: string }) => (
  <LabelChip label={category} colors={CATEGORY_COLORS} variant="soft" />
);

export const LevelChip = ({ level }: { level: string }) => (
  <LabelChip label={level} colors={LEVEL_COLORS} variant="secondary" />
);
