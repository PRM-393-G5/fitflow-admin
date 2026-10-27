import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Client errors (bad input, 401, 404) will not fix themselves.
        retry: (failures, error) =>
          failures < 2 &&
          !(
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ),
      },
    },
  });
}
