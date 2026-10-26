import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createApiClient } from '../api/client';
import { API_BASE_URL } from '../config';
import { AuthContext } from './context';
import {
  createSessionStore,
  loadSession,
  sessionFromLogin,
  type LoginResult,
} from './session';

/** setTimeout cannot wait longer than this (~24.8 days). */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Holds the admin session (persisted in localStorage) and the API client
 * that sends its token. The session ends when the token expires or the
 * API rejects it.
 */
export function AuthProvider({
  children,
  fetchImpl,
}: {
  children: ReactNode;
  /** Replaces `fetch` in tests. */
  fetchImpl?: typeof fetch;
}) {
  const queryClient = useQueryClient();
  const [store] = useState(() => createSessionStore(loadSession()));
  const session = useSyncExternalStore(store.subscribe, store.get);

  const logout = useCallback(() => {
    store.set(null);
    queryClient.clear();
  }, [store, queryClient]);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => store.get()?.accessToken ?? null,
        onUnauthorized: logout,
        fetch: fetchImpl,
      }),
    [store, logout, fetchImpl],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<LoginResult>('admin/auth/login', {
        email,
        password,
      });
      store.set(sessionFromLogin(result));
    },
    [api, store],
  );

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      logout,
      Math.min(Math.max(session.expiresAt - Date.now(), 0), MAX_TIMEOUT_MS),
    );
    return () => clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo(
    () => ({ session, api, login, logout }),
    [session, api, login, logout],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
