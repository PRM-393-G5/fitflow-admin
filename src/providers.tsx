import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import { BRAND_COLOR } from './theme';

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
    <ConfigProvider theme={{ token: { colorPrimary: BRAND_COLOR } }}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider fetchImpl={fetchImpl}>{children}</AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
