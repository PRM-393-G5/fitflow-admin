import { I18nProvider, Toast } from '@heroui/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { ThemeProvider } from './theme/ThemeProvider';

/** Theme, data cache, session and toasts, shared by the app and its tests. */
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
    // The admin is in English, and numbers are typed with a "." decimal
    // point whatever the browser's language (vi-VN would read "2.5" as 25).
    <I18nProvider locale="en-US">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider fetchImpl={fetchImpl}>{children}</AuthProvider>
        </QueryClientProvider>
        <Toast.Provider placement="bottom end" />
      </ThemeProvider>
    </I18nProvider>
  );
}
