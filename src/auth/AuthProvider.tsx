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

  const endSession = useCallback(
    (token?: string) => {
      if (!store.get()) return;
      store.end(token);
      if (!store.get()) queryClient.clear();
    },
    [store, queryClient],
  );
  const logout = useCallback(() => endSession(), [endSession]);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE_URL,
        getToken: () => store.get()?.accessToken ?? null,
        onUnauthorized: endSession,
        fetch: fetchImpl,
      }),
    [store, endSession, fetchImpl],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<LoginResult>('admin/auth/login', {
        email,
        password,
      });
      store.start(sessionFromLogin(result));
    },
    [api, store],
  );

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    // Long waits are split: setTimeout overflows past MAX_TIMEOUT_MS.
    const check = () => {
      const left = session.expiresAt - Date.now();
      if (left <= 0) endSession(session.accessToken);
      else timer = setTimeout(check, Math.min(left, MAX_TIMEOUT_MS));
    };
    check();
    return () => clearTimeout(timer);
  }, [session, endSession]);

  const value = useMemo(
    () => ({ session, api, login, logout }),
    [session, api, login, logout],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
