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
  if (!(Number.isFinite(result.expiresIn) && result.expiresIn > 0)) {
    throw new Error('The API returned no token lifetime');
  }
  if (
    typeof result.accessToken !== 'string' ||
    !result.accessToken ||
    typeof result.admin?.email !== 'string'
  ) {
    throw new Error('The API returned an incomplete sign-in');
  }
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
      Number.isFinite(session.expiresAt) &&
      session.expiresAt! > now &&
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

/**
 * Persisting is best effort: with storage full or blocked the session
 * still works in this tab, it just does not survive a reload.
 */
export function saveSession(session: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Kept in memory only.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored that we could remove.
  }
}

/** How the admin is shown: their name, else their email. */
export const displayName = (admin: AdminProfile) => admin.name || admin.email;

export interface SessionStore {
  get: () => Session | null;
  /** Starts a new session and persists it (other tabs pick it up). */
  start: (session: Session) => void;
  /**
   * Ends the session holding [token] (default: the current one). A stale
   * token, e.g. from a request sent before a new sign-in, ends nothing.
   */
  end: (token?: string) => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * The current session, outside React so the API client reads the token
 * the moment it changes (a page querying right after login sends it).
 * Tabs share it through localStorage: signing in or out in one tab
 * updates the others.
 */
export function createSessionStore(initial: Session | null): SessionStore {
  let current = initial;
  const listeners = new Set<() => void>();
  const update = (session: Session | null) => {
    if (session?.accessToken === current?.accessToken) return;
    current = session;
    for (const listener of listeners) listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) update(loadSession());
  };
  return {
    get: () => current,
    start(session) {
      saveSession(session);
      update(session);
    },
    end(token = current?.accessToken) {
      if (!current || current.accessToken !== token) return;
      // Another tab may have signed in since: only clear our own token.
      if (loadSession()?.accessToken === token) clearSession();
      update(null);
    },
    subscribe(listener) {
      if (listeners.size === 0) addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) removeEventListener('storage', onStorage);
      };
    },
  };
}
