import { Card } from '@heroui/react';
import type { ReactNode } from 'react';

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'default';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/10 text-danger',
  default: 'bg-default text-muted',
};

/** A headline number: label, value, an icon badge and a line of context. */
export function StatTile({
  label,
  value,
  note,
  icon,
  tone = 'accent',
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <Card className="h-full gap-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon && (
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-[18px] ${TONES[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </Card>
  );
}
