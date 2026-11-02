import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp, signIn, type FakeApi } from '../../test/render';
import type { UserDetail, UserSummary } from './types';

const alice: UserSummary = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice Nguyen',
  photoUrl: null,
  disabled: false,
  createdAt: '2026-10-01T03:00:00.000Z',
  lastSignInAt: '2026-10-26T03:00:00.000Z',
  sessionCount: 12,
};

const bob: UserSummary = {
  ...alice,
  id: 'u2',
  email: 'bob@example.com',
  name: null,
  disabled: true,
  sessionCount: 0,
  lastSignInAt: null,
};

const aliceDetail: UserDetail = {
  ...alice,
  profile: {
    goal: 'Strength',
    level: 'Intermediate',
    weeklyGoal: 4,
    heightCm: 170,
    age: 24,
    isMale: false,
    activityLevel: 2,
  },
  counts: { sessions: 12, formChecks: 3, workouts: 2, weights: 5, meals: 40 },
  totals: { minutes: 610, volumeKg: 23456.5 },
  latestWeightKg: 58.5,
  lastSyncAt: '2026-10-26T04:00:00.000Z',
  recentSessions: [
    {
      id: 's1',
      workoutName: 'Upper Power',
      completedAt: '2026-10-26T18:30:00.000',
      minutes: 50,
      completedSets: 18,
      volumeKg: 3200,
      formCheck: false,
    },
    {
      id: 'f1',
      workoutName: 'Form check · Squat',
      completedAt: '2026-10-25T07:00:00.000',
      minutes: 1,
      completedSets: 1,
      volumeKg: 0,
      formCheck: true,
    },
  ],
};

const page = (items: UserSummary[]) => ({
  status: 200,
  body: { items, total: items.length, page: 1, limit: 20 },
});

describe('users', () => {
  beforeEach(signIn);

  it('lists users with their status', async () => {
    renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice, bob]),
    });
    expect(
      await screen.findByRole('link', { name: 'Alice Nguyen' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'bob@example.com' })).toBeVisible();
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Active')).toBeVisible();
    expect(within(rows[1]).getByText('Locked')).toBeVisible();
    expect(screen.getByText('1–2 of 2 users')).toBeVisible();
  });

  it('searches and filters through the URL', async () => {
    const { router, calls } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice, bob]),
      'GET admin/users?page=1&limit=20&search=alice': () => page([alice]),
      'GET admin/users?page=1&limit=20&search=alice&status=locked': () =>
        page([]),
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Search users'), 'alice');
    await waitFor(() => expect(router.state.location.search).toBe('?q=alice'));
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'bob@example.com' }),
      ).toBeNull(),
    );
    await user.click(screen.getByRole('radio', { name: 'Locked' }));
    await waitFor(() =>
      expect(calls.at(-1)?.path).toBe(
        'admin/users?page=1&limit=20&search=alice&status=locked',
      ),
    );
    expect(router.state.location.search).toBe('?q=alice&status=locked');
  });

  it('clears the search box when the URL loses its search', async () => {
    const { router } = renderApp('/users?q=alice', {
      'GET admin/users?page=1&limit=20&search=alice': () => page([alice]),
      'GET admin/users?page=1&limit=20': () => page([alice, bob]),
    });
    const box = await screen.findByLabelText('Search users');
    expect(box).toHaveValue('alice');
    await router.navigate('/users');
    await waitFor(() => expect(box).toHaveValue(''));
    // The debounce must not write the old search back.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(router.state.location.search).toBe('');
    expect(
      await screen.findByRole('link', { name: 'bob@example.com' }),
    ).toBeVisible();
  });

  it('keeps a space being typed when the search reaches the URL', async () => {
    const { router } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice, bob]),
      'GET admin/users?page=1&limit=20&search=alice': () => page([alice]),
      'GET admin/users?page=1&limit=20&search=alice+n': () => page([alice]),
    });
    const user = userEvent.setup();
    const box = await screen.findByLabelText('Search users');
    await user.type(box, 'alice ');
    await waitFor(() => expect(router.state.location.search).toBe('?q=alice'));
    expect(box).toHaveValue('alice ');
    await user.type(box, 'n');
    await waitFor(() =>
      expect(router.state.location.search).toBe('?q=alice+n'),
    );
  });

  it('follows Back to a search the page itself wrote', async () => {
    const { router } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice, bob]),
      'GET admin/users?page=1&limit=20&search=bob': () => page([bob]),
    });
    const user = userEvent.setup();
    const box = await screen.findByLabelText('Search users');
    await user.type(box, 'bob');
    await waitFor(() => expect(router.state.location.search).toBe('?q=bob'));
    await router.navigate('/users');
    await waitFor(() => expect(box).toHaveValue(''));
    await router.navigate(-1);
    await waitFor(() => expect(box).toHaveValue('bob'));
    // The debounce must not overwrite the restored search.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(router.state.location.search).toBe('?q=bob');
  });

  it('goes back to the last page when the asked one is past the end', async () => {
    const { router } = renderApp('/users?page=3', {
      'GET admin/users?page=3&limit=20': () => ({
        status: 200,
        body: { items: [], total: 1, page: 3, limit: 20 },
      }),
      'GET admin/users?page=1&limit=20': () => page([alice]),
    });
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(
      await screen.findByRole('link', { name: 'Alice Nguyen' }),
    ).toBeVisible();
  });

  it('opens a user from the list', async () => {
    const { router } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice]),
      'GET admin/users/u1': () => ({ status: 200, body: aliceDetail }),
    });
    // Clicking the row (not just the name link) opens the user.
    await userEvent.click(await screen.findByText('12'));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/users/u1'),
    );
  });

  it('opens a user from the name link with one history entry', async () => {
    const { router } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => page([alice]),
      'GET admin/users/u1': () => ({ status: 200, body: aliceDetail }),
    });
    await userEvent.click(
      await screen.findByRole('link', { name: 'Alice Nguyen' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/users/u1'),
    );
    // The row did not open the user a second time.
    await router.navigate(-1);
    expect(router.state.location.pathname).toBe('/users');
  });

  it('pages and resizes the list through the URL', async () => {
    const { router } = renderApp('/users', {
      'GET admin/users?page=1&limit=20': () => ({
        status: 200,
        body: { items: [alice, bob], total: 45, page: 1, limit: 20 },
      }),
      'GET admin/users?page=2&limit=20': () => ({
        status: 200,
        body: { items: [bob], total: 45, page: 2, limit: 20 },
      }),
      'GET admin/users?page=1&limit=50': () => ({
        status: 200,
        body: { items: [alice, bob], total: 45, page: 1, limit: 50 },
      }),
    });
    const user = userEvent.setup();
    expect(await screen.findByText('1–20 of 45 users')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText('21–40 of 45 users')).toBeVisible();
    expect(router.state.location.search).toBe('?page=2');

    await user.click(screen.getByRole('button', { name: /per page/ }));
    await user.click(
      await screen.findByRole('option', { name: '50 per page' }),
    );
    expect(await screen.findByText('1–45 of 45 users')).toBeVisible();
    // A new page size starts again from page 1.
    expect(router.state.location.search).toBe('?limit=50');
  });

  it("shows a user's profile, totals and recent sessions", async () => {
    renderApp('/users/u1', {
      'GET admin/users/u1': () => ({ status: 200, body: aliceDetail }),
    });
    expect(await screen.findByText('Build muscle')).toBeVisible();
    expect(screen.getByText('Moderate')).toBeVisible();
    expect(screen.getByText('4 workouts')).toBeVisible();
    expect(screen.getByText('10 h 10 min')).toBeVisible();
    expect(screen.getByText('23,456.5 kg')).toBeVisible();
    expect(screen.getByText('5 (latest 58.5 kg)')).toBeVisible();
    expect(screen.getByText('Upper Power')).toBeVisible();
    expect(screen.getByText('Form check')).toBeVisible();
  });

  it('locks an account after confirming', async () => {
    let detail = aliceDetail;
    const api: FakeApi = {
      'GET admin/users/u1': () => ({ status: 200, body: detail }),
      'PATCH admin/users/u1': (body) => {
        detail = {
          ...detail,
          disabled: (body as { disabled: boolean }).disabled,
        };
        return { status: 200, body: { ...alice, disabled: detail.disabled } };
      },
    };
    const { calls } = renderApp('/users/u1', api);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Lock/ }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Lock account',
      }),
    );
    expect(
      await screen.findByText(/This account is locked/),
    ).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      disabled: true,
    });
    expect(screen.getByText('Locked')).toBeVisible();
    expect(screen.getByRole('button', { name: /Unlock/ })).toBeVisible();
  });

  it('deletes an account only once the email is typed', async () => {
    const { router, calls } = renderApp('/users?status=active', {
      'GET admin/users?page=1&limit=20&status=active': () => page([alice]),
      'GET admin/users/u1': () => ({ status: 200, body: aliceDetail }),
      'DELETE admin/users/u1': () => ({ status: 204 }),
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('link', { name: 'Alice Nguyen' }));
    await user.click(await screen.findByRole('button', { name: /Delete/ }));
    const confirm = await screen.findByRole('button', {
      name: 'Delete account',
    });
    expect(confirm).toBeDisabled();
    await user.type(
      screen.getByLabelText('Email to confirm'),
      'ALICE@example.com',
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    // Back to the list it came from, filters included.
    await waitFor(() =>
      expect(router.state.location).toMatchObject({
        pathname: '/users',
        search: '?status=active',
      }),
    );
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    // The deleted user's page was not refetched (no 404 flash).
    expect(calls.filter((call) => call.path === 'admin/users/u1')).toHaveLength(
      2,
    );
  });

  it('shows "User not found" for a deleted user, even from cache', async () => {
    let deleted = false;
    const { router } = renderApp('/users/u1', {
      'GET admin/users/u1': () =>
        deleted
          ? { status: 404, body: { message: 'User u1 not found' } }
          : { status: 200, body: aliceDetail },
      'DELETE admin/users/u1': () => {
        deleted = true;
        return { status: 204 };
      },
      'GET admin/users?page=1&limit=20': () => page([]),
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Delete/ }));
    await user.type(
      await screen.findByLabelText('Email to confirm'),
      'alice@example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/users'));
    await router.navigate('/users/u1');
    expect(await screen.findByText('User not found')).toBeVisible();
  });

  it('says when a user does not exist', async () => {
    renderApp('/users/nope', {
      'GET admin/users/nope': () => ({
        status: 404,
        body: { message: 'User nope not found' },
      }),
    });
    expect(await screen.findByText('User not found')).toBeVisible();
  });
});
