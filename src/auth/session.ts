export interface AdminProfile {
  id: string;
  email: string;
  name: string | null;
}

/** A signed-in admin: the API's access token and when it expires. */
export interface Session {
  accessToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  admin: AdminProfile;
}

/** What `POST /api/admin/auth/login` returns. */
export interface LoginResult {
  accessToken: string;
  /** Seconds. */
  expiresIn: number;
  admin: AdminProfile;
}

const KEY = 'fitflow-admin.session';

export function sessionFromLogin(result: LoginResult, now = Date.now()) {
  return {
    accessToken: result.accessToken,
    expiresAt: now + result.expiresIn * 1000,
    admin: result.admin,
  } satisfies Session;
}

/** The stored session, or null when absent, malformed or expired. */
export function loadSession(now = Date.now()): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<Session>;
    if (
      typeof session.accessToken === 'string' &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt > now &&
      typeof session.admin?.email === 'string'
    ) {
      return session as Session;
    }
  } catch {
    // Corrupt entry: treat as signed out.
  }
  clearSession();
  return null;
}

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export interface SessionStore {
  get: () => Session | null;
  /** Replaces the session (null signs out) and persists the change. */
  set: (session: Session | null) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * The current session, outside React so the API client reads the token
 * the moment it changes (a page querying right after login sends it).
 */
export function createSessionStore(initial: Session | null): SessionStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(session) {
      current = session;
      if (session) saveSession(session);
      else clearSession();
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
