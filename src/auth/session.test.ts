import { describe, expect, it } from 'vitest';
import {
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
