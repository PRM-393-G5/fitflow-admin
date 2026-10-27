import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp, signIn } from '../../test/render';
import { browserTimeZone } from './api';
import type { AiUsageReport, StatsOverview } from './types';

const path = (route: string, days: number) =>
  `admin/stats/${route}?${new URLSearchParams({ days: String(days), tz: browserTimeZone() })}`;

const day = (date: string, sessions: number) => ({
  date,
  newUsers: 1,
  sessions,
  formChecks: 2,
  aiCalls: 3,
  aiErrors: 1,
});

const overview = (days: number): StatsOverview => ({
  range: { days, tz: 'Asia/Ho_Chi_Minh', from: '2026-10-26', to: '2026-10-27' },
  users: { total: 1284, locked: 3, new: 12, active: 40 },
  sessions: {
    total: 15_200,
    inRange: days === 7 ? 70 : 300,
    minutesInRange: 125,
    formChecksInRange: 9,
  },
  ai: { calls: 33, errors: 4 },
  templates: 6,
  daily: [day('2026-10-26', 5), day('2026-10-27', 8)],
});

const aiReport: AiUsageReport = {
  range: { days: 30, tz: 'UTC', from: '2026-09-28', to: '2026-10-27' },
  status: { configured: false, model: 'gpt-6-luna' },
  totals: {
    calls: 20,
    errors: 5,
    users: 2,
    anonymousCalls: 1,
    avgDurationMs: 4250,
  },
  byFeature: [
    { feature: 'meal-plan', calls: 12, errors: 3, avgDurationMs: 5000 },
    { feature: 'food-photo', calls: 8, errors: 2, avgDurationMs: 3000 },
  ],
  daily: [{ date: '2026-10-27', calls: 20, errors: 5 }],
  errorsByCode: [{ code: 'rate-limited', count: 5 }],
  topUsers: [
    { id: 'u1', email: 'alice@example.com', name: 'Alice', calls: 15 },
    { id: 'u9', email: null, name: null, calls: 4 },
  ],
  recent: [
    {
      id: 'c1',
      createdAt: '2026-10-27T05:00:00.000Z',
      feature: 'meal-plan',
      ok: false,
      errorCode: 'rate-limited',
      durationMs: 1200,
      model: 'gpt-6-luna',
      user: { id: 'u1', email: 'alice@example.com', name: 'Alice' },
    },
  ],
};

describe('dashboard', () => {
  beforeEach(signIn);

  it('shows the headline numbers for the range', async () => {
    renderApp('/', {
      'GET health': () => ({
        status: 200,
        body: { status: 'ok', database: 'up' },
      }),
      [`GET ${path('overview', 30)}`]: () => ({
        status: 200,
        body: overview(30),
      }),
    });
    expect(await screen.findByText('1,284')).toBeVisible();
    expect(screen.getByText('12 new · 3 locked')).toBeVisible();
    expect(screen.getByText('300')).toBeVisible();
    expect(screen.getByText('15.2K all time')).toBeVisible();
    expect(screen.getByText('2 h 5 min')).toBeVisible();
    expect(screen.getByText('4 failed · details')).toBeVisible();
  });

  it('switches the range through the URL and keeps every number in step', async () => {
    const { router, calls } = renderApp('/', {
      'GET health': () => ({
        status: 200,
        body: { status: 'ok', database: 'up' },
      }),
      [`GET ${path('overview', 30)}`]: () => ({
        status: 200,
        body: overview(30),
      }),
      [`GET ${path('overview', 7)}`]: () => ({
        status: 200,
        body: overview(7),
      }),
    });
    await screen.findByText('300');
    await userEvent.click(screen.getByText('Last 7 days'));
    expect(await screen.findByText('70')).toBeVisible();
    expect(router.state.location.search).toBe('?days=7');
    expect(calls.map((call) => call.path)).toContain(path('overview', 7));
  });

  it('offers each chart as a table', async () => {
    renderApp('/', {
      'GET health': () => ({
        status: 200,
        body: { status: 'ok', database: 'up' },
      }),
      [`GET ${path('overview', 30)}`]: () => ({
        status: 200,
        body: overview(30),
      }),
    });
    await screen.findByText('300');
    const card = screen
      .getByText('Workouts per day')
      .closest('.card') as HTMLElement;
    await userEvent.click(within(card).getByText('Table'));
    const rows = within(card).getAllByRole('row').slice(1);
    // Newest day first: day, workouts, form checks.
    expect(rows[0]).toHaveTextContent('27 Oct82');
    expect(rows[1]).toHaveTextContent('26 Oct52');
  });
});

describe('AI usage', () => {
  beforeEach(signIn);

  it('summarises calls, failures and users', async () => {
    renderApp('/ai', {
      [`GET ${path('ai', 30)}`]: () => ({ status: 200, body: aiReport }),
    });
    expect(await screen.findByText('25% of calls')).toBeVisible();
    expect(screen.getByText('4.3 s')).toBeVisible();
    expect(screen.getByText('+ 1 calls from deleted accounts')).toBeVisible();
    expect(screen.getByText(/OPENAI_API_KEY is not set/)).toBeVisible();
    // In the failures table and on the latest call.
    expect(screen.getAllByText('OpenAI rate limit')).toHaveLength(2);
    // In the top users and on the latest call, both linking to the user.
    for (const link of screen.getAllByRole('link', { name: 'Alice' })) {
      expect(link).toHaveAttribute('href', '/users/u1');
    }
    expect(screen.getByText('Deleted account')).toBeVisible();
  });

  it('lists features in a table view too', async () => {
    renderApp('/ai', {
      [`GET ${path('ai', 30)}`]: () => ({ status: 200, body: aiReport }),
    });
    const card = (await screen.findByText('Calls by feature')).closest(
      '.card',
    ) as HTMLElement;
    await userEvent.click(within(card).getByText('Table'));
    await waitFor(() =>
      expect(within(card).getByText('Meal plan')).toBeVisible(),
    );
    expect(within(card).getByText('Food photo')).toBeVisible();
  });

  it('pages through the latest calls', async () => {
    const recent = Array.from({ length: 12 }, (_, index) => ({
      ...aiReport.recent[0],
      id: `c${index + 1}`,
      ok: true,
      errorCode: null,
      user: {
        id: `u${index + 1}`,
        email: `user${index + 1}@example.com`,
        name: `User ${index + 1}`,
      },
    }));
    renderApp('/ai', {
      [`GET ${path('ai', 30)}`]: () => ({
        status: 200,
        body: { ...aiReport, recent },
      }),
    });
    expect(await screen.findByText('1–10 of 12 calls')).toBeVisible();
    expect(screen.getByRole('link', { name: 'User 10' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'User 11' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText('11–12 of 12 calls')).toBeVisible();
    expect(screen.getByRole('link', { name: 'User 11' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'User 10' })).toBeNull();
  });
});
