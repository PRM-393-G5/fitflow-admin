import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';

/** Theme, data cache and session, shared by the app and its tests. */
export function Providers({
  children,
  queryClient,
  fetchImpl,
}: {
  children: ReactNode;
  queryClient: QueryClient;
  fetchImpl?: typeof fetch;
}) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider fetchImpl={fetchImpl}>{children}</AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
