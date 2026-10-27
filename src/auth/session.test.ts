import { describe, expect, it, vi } from 'vitest';
import {
  createSessionStore,
  loadSession,
  saveSession,
  sessionFromLogin,
  type Session,
} from './session';

const admin = { id: 'a1', email: 'boss@example.com', name: 'Boss' };

describe('session storage', () => {
  it('turns expiresIn into an absolute expiry', () => {
    expect(
      sessionFromLogin({ accessToken: 't', expiresIn: 60, admin }, 1_000),
    ).toEqual({ accessToken: 't', expiresAt: 61_000, admin });
  });

  it('round-trips a live session', () => {
    const session: Session = { accessToken: 't', expiresAt: 5_000, admin };
    saveSession(session);
    expect(loadSession(4_999)).toEqual(session);
  });

  it('drops expired and corrupt sessions', () => {
    saveSession({ accessToken: 't', expiresAt: 5_000, admin });
    expect(loadSession(5_000)).toBeNull();
    expect(localStorage.length).toBe(0);

    localStorage.setItem('fitflow-admin.session', '{not json');
    expect(loadSession()).toBeNull();
    localStorage.setItem('fitflow-admin.session', '{"accessToken":1}');
    expect(loadSession()).toBeNull();
  });
});

describe('createSessionStore', () => {
  const live = (token: string): Session => ({
    accessToken: token,
    expiresAt: Date.now() + 60_000,
    admin,
  });

  it('ignores a stale token ending a newer session', () => {
    const store = createSessionStore(null);
    store.start(live('old'));
    store.start(live('new'));
    store.end('old');
    expect(store.get()?.accessToken).toBe('new');
    expect(loadSession()?.accessToken).toBe('new');
    store.end();
    expect(store.get()).toBeNull();
    expect(loadSession()).toBeNull();
  });

  it("does not wipe another tab's newer session", () => {
    const store = createSessionStore(live('tab-b'));
    // Tab A signed in meanwhile and wrote its token.
    saveSession(live('tab-a'));
    store.end('tab-b');
    expect(store.get()).toBeNull();
    expect(loadSession()?.accessToken).toBe('tab-a');
  });

  it('follows sign-in and sign-out in other tabs', () => {
    const store = createSessionStore(null);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    saveSession(live('other-tab'));
    dispatchEvent(
      new StorageEvent('storage', { key: 'fitflow-admin.session' }),
    );
    expect(store.get()?.accessToken).toBe('other-tab');
    localStorage.clear();
    dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(store.get()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
