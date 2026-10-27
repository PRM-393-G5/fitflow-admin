import { Alert, Skeleton } from '@heroui/react';
import type { ReactNode } from 'react';

/** A banner above the page's content: what went wrong or needs a look. */
export function Notice({
  status,
  title,
  children,
}: {
  status: 'danger' | 'warning' | 'success' | 'accent';
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Alert status={status} className="mb-6">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {children && <Alert.Description>{children}</Alert.Description>}
      </Alert.Content>
    </Alert>
  );
}

/** Stat tiles and two chart cards, while a report loads. */
export function ReportSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div aria-busy aria-label="Loading" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: tiles }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-80 rounded-3xl xl:col-span-7" />
        <Skeleton className="h-80 rounded-3xl xl:col-span-5" />
      </div>
    </div>
  );
}

/** Fades a report while the next range loads in its place. */
export function Dimmed({
  when,
  children,
}: {
  when: boolean;
  children: ReactNode;
}) {
  return (
    <div
      aria-busy={when}
      className={`flex flex-col gap-4 transition-opacity duration-200 ${when ? 'opacity-55' : ''}`}
    >
      {children}
    </div>
  );
}

/** What a table shows when it has no rows. */
export function EmptyRows({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted">{children}</p>;
}
