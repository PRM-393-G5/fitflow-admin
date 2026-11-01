import { Card } from '@heroui/react';
import type { ReactNode } from 'react';

/** A card with a title, an optional line of context and header actions. */
export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="h-full">
      <Card.Header className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <Card.Title className="text-base font-semibold">{title}</Card.Title>
          {description && <Card.Description>{description}</Card.Description>}
        </div>
        {actions}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
