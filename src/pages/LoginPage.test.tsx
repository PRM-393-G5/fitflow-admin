import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { saveSession } from '../auth/session';
import { renderApp, type FakeApi } from '../test/render';
import { loginErrorMessage } from './loginErrorMessage';

const admin = { id: 'a1', email: 'boss@example.com', name: 'Boss' };

const api: FakeApi = {
  'POST admin/auth/login': (body) => {
    const { email, password } = body as { email: string; password: string };
    return email === 'boss@example.com' && password === 'secret-pass'
      ? {
          status: 200,
          body: { accessToken: 'token-1', expiresIn: 28800, admin },
        }
      : { status: 401, body: { message: 'Invalid email or password' } };
  },
  'GET health': () => ({ status: 200, body: { status: 'ok', database: 'up' } }),
};

async function signIn(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('login', () => {
  it('sends signed-out visitors to the login page', async () => {
    const { router } = renderApp('/', api);
    expect(
      await screen.findByText('Sign in with your admin account'),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('signs in and opens the dashboard with the token', async () => {
    const { router, calls } = renderApp('/', api);
    await signIn(' boss@example.com ', 'secret-pass');

    expect(await screen.findByText('Welcome, Boss')).toBeVisible();
    expect(router.state.location.pathname).toBe('/');
    expect(await screen.findByText('API ok, database up')).toBeVisible();
    expect(
      calls.find((call) => call.path === 'admin/auth/login')?.body,
    ).toEqual({
      email: 'boss@example.com',
      password: 'secret-pass',
    });
    expect(calls.find((call) => call.path === 'health')?.auth).toBe(
      'Bearer token-1',
    );
    expect(localStorage.getItem('fitflow-admin.session')).toContain('token-1');
  });

  it('returns to the page asked for, query included', async () => {
    const { router } = renderApp('/?tab=2#top', api);
    await signIn('boss@example.com', 'secret-pass');
    expect(await screen.findByText('Welcome, Boss')).toBeVisible();
    expect(router.state.location).toMatchObject({
      pathname: '/',
      search: '?tab=2',
      hash: '#top',
    });
  });

  it('explains a wrong password and stays on the page', async () => {
    const { router } = renderApp('/login', api);
    await signIn('boss@example.com', 'wrong-pass');
    expect(await screen.findByText('Wrong email or password.')).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('signs out from the header', async () => {
    saveSession({
      accessToken: 'token-1',
      expiresAt: Date.now() + 60_000,
      admin,
    });
    const { router } = renderApp('/', api);
    await userEvent.click(
      await screen.findByRole('button', { name: /Sign out/ }),
    );
    expect(
      await screen.findByText('Sign in with your admin account'),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
    expect(localStorage.getItem('fitflow-admin.session')).toBeNull();
  });

  it('returns to the login page when the API rejects the token', async () => {
    saveSession({
      accessToken: 'stale',
      expiresAt: Date.now() + 60_000,
      admin,
    });
    const { router } = renderApp('/', {
      'GET health': () => ({ status: 401, body: { message: 'expired' } }),
    });
    expect(
      await screen.findByText('Sign in with your admin account'),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('drops cached data when another tab signs in as someone else', async () => {
    saveSession({
      accessToken: 'token-1',
      expiresAt: Date.now() + 60_000,
      admin,
    });
    let healthCalls = 0;
    renderApp('/', {
      'GET health': () => {
        healthCalls += 1;
        return { status: 200, body: { status: 'ok', database: 'up' } };
      },
    });
    expect(await screen.findByText('API ok, database up')).toBeVisible();
    saveSession({
      accessToken: 'token-2',
      expiresAt: Date.now() + 60_000,
      admin: { id: 'a2', email: 'other@example.com', name: 'Other' },
    });
    dispatchEvent(
      new StorageEvent('storage', { key: 'fitflow-admin.session' }),
    );
    expect(await screen.findByText('Welcome, Other')).toBeVisible();
    await waitFor(() => expect(healthCalls).toBe(2));
  });

  it('shows a database outage as a warning', async () => {
    saveSession({
      accessToken: 'token-1',
      expiresAt: Date.now() + 60_000,
      admin,
    });
    renderApp('/', {
      'GET health': () => ({
        status: 503,
        body: { message: 'Database unreachable' },
      }),
    });
    expect(
      await screen.findByText('API up, database unreachable'),
    ).toBeVisible();
  });

  it('checks the fields, and clears an error once it is fixed', async () => {
    const { calls } = renderApp('/login', api);
    const user = userEvent.setup();
    const email = await screen.findByLabelText('Email');
    await user.type(email, 'boss@');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email')).toBeVisible();
    expect(screen.getByText('Enter your password')).toBeVisible();
    expect(calls.some((call) => call.path === 'admin/auth/login')).toBe(false);

    // Any address the API accepts for an admin, e.g. admin@localhost.
    await user.type(email, 'localhost');
    expect(screen.queryByText('Enter a valid email')).toBeNull();
    // The other field keeps its error until it is fixed too.
    expect(screen.getByText('Enter your password')).toBeVisible();
  });

  it('drops an old sign-in error when the fields need fixing', async () => {
    renderApp('/login', api);
    await signIn('boss@example.com', 'wrong-pass');
    expect(await screen.findByText('Wrong email or password.')).toBeVisible();
    await userEvent.clear(screen.getByLabelText('Password'));
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter your password')).toBeVisible();
    expect(screen.queryByText('Wrong email or password.')).toBeNull();
  });

  it('shows and hides the password', async () => {
    renderApp('/login', api);
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' }),
    );
    expect(password).toHaveAttribute('type', 'text');
    await userEvent.click(
      screen.getByRole('button', { name: 'Hide password' }),
    );
    expect(password).toHaveAttribute('type', 'password');
  });

  it('words each failure for the admin', () => {
    expect(loginErrorMessage(new ApiError(429, 'x'))).toMatch(
      /Too many attempts/,
    );
    expect(loginErrorMessage(new ApiError(0, 'x'))).toMatch(/Cannot reach/);
    expect(loginErrorMessage(new ApiError(500, 'Boom'))).toBe('Boom');
  });
});
