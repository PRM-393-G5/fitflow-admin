import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp, signIn, type FakeApi } from '../../test/render';
import type { Template } from './types';

const exercise = {
  id: 'squat',
  name: 'Bodyweight Squat',
  muscleGroup: 'Legs',
  sets: 3,
  reps: 12,
  durationSeconds: 0,
  restSeconds: 45,
  weightKg: 0,
};

const template = (id: string, name: string): Template => ({
  id,
  name,
  durationMinutes: 5,
  level: 'Beginner',
  category: 'Strength',
  description: '',
  exercises: [exercise],
  updatedAt: '2026-10-27T05:00:00.000Z',
});

/** An in-memory /api/admin/templates. */
function templatesApi(initial: Template[]) {
  const state = { list: [...initial] };
  const api: FakeApi = {
    'GET admin/templates': () => ({ status: 200, body: state.list }),
    'POST admin/templates': (body) => {
      const created = {
        ...(body as Template),
        updatedAt: '2026-10-27T06:00:00.000Z',
      };
      if (state.list.some((item) => item.id === created.id)) {
        return {
          status: 409,
          body: { message: `Template ${created.id} already exists` },
        };
      }
      state.list.push(created);
      return { status: 201, body: created };
    },
    'POST admin/templates/reorder': (body) => {
      const ids = (body as { ids: string[] }).ids;
      state.list = ids.map((id) => state.list.find((item) => item.id === id)!);
      return { status: 200, body: state.list };
    },
  };
  for (const item of initial) {
    api[`GET admin/templates/${item.id}`] = () => ({
      status: 200,
      body: state.list.find((entry) => entry.id === item.id),
    });
    api[`PUT admin/templates/${item.id}`] = (body) => {
      const index = state.list.findIndex((entry) => entry.id === item.id);
      state.list[index] = { ...state.list[index], ...(body as Template) };
      return { status: 200, body: state.list[index] };
    };
    api[`DELETE admin/templates/${item.id}`] = () => {
      state.list = state.list.filter((entry) => entry.id !== item.id);
      return { status: 204 };
    };
  }
  return { api, state };
}

const rowNames = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[1].textContent);

describe('templates', () => {
  beforeEach(signIn);

  it('lists the templates in order with their details', async () => {
    renderApp(
      '/templates',
      templatesApi([template('a', 'Alpha'), template('b', 'Beta')]).api,
    );
    expect(await screen.findByRole('link', { name: 'Alpha' })).toBeVisible();
    expect(rowNames()).toEqual(['Alphaa', 'Betab']);
    expect(screen.getAllByText('Strength')).toHaveLength(2);
    expect(screen.getAllByText('5 min')).toHaveLength(2);
  });

  it('moves a template down', async () => {
    const { api } = templatesApi([
      template('a', 'Alpha'),
      template('b', 'Beta'),
    ]);
    const { calls } = renderApp('/templates', api);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Move Alpha down' }),
    );
    await waitFor(() => expect(rowNames()).toEqual(['Betab', 'Alphaa']));
    expect(
      calls.find((call) => call.path === 'admin/templates/reorder')?.body,
    ).toEqual({
      ids: ['b', 'a'],
    });
  });

  it('deletes a template after confirming', async () => {
    const { api, state } = templatesApi([
      template('a', 'Alpha'),
      template('b', 'Beta'),
    ]);
    renderApp('/templates', api);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete Alpha' }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    await waitFor(() => expect(rowNames()).toEqual(['Betab']));
    expect(state.list.map((item) => item.id)).toEqual(['b']);
  });

  it('creates a template with an id derived from its name', async () => {
    const { api } = templatesApi([template('a', 'Alpha')]);
    const { router, calls } = renderApp('/templates/new', api);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Name'), 'Đẩy ngực');
    expect(screen.getByLabelText('Id')).toHaveValue('day-nguc');
    await user.type(screen.getByLabelText('Name of exercise 1'), 'Push-up');
    await user.type(
      screen.getByLabelText('Muscle group of exercise 1'),
      'Chest',
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/templates'),
    );
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      id: 'day-nguc',
      name: 'Đẩy ngực',
      category: 'Strength',
      level: 'Beginner',
      description: '',
      // 3 × (30 s + 60 s rest) = 270 s.
      durationMinutes: 5,
      exercises: [
        {
          id: 'push-up',
          name: 'Push-up',
          muscleGroup: 'Chest',
          sets: 3,
          reps: 10,
          durationSeconds: 0,
          restSeconds: 60,
          weightKg: 0,
        },
      ],
    });
  });

  it('clears the id error once the name fills the id in', async () => {
    renderApp('/templates/new', templatesApi([]).api);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter an id')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Leg Day');
    expect(screen.getByLabelText('Id')).toHaveValue('leg-day');
    await waitFor(() =>
      expect(screen.queryByText('Enter an id')).not.toBeInTheDocument(),
    );
  });

  it('shows the API refusing a taken id', async () => {
    renderApp('/templates/new', templatesApi([template('alpha', 'Alpha')]).api);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Name'), 'Alpha');
    await user.type(screen.getByLabelText('Name of exercise 1'), 'Push-up');
    await user.type(
      screen.getByLabelText('Muscle group of exercise 1'),
      'Chest',
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('Template alpha already exists'),
    ).toBeVisible();
  });

  it('edits a template, keeping its id and exercise ids', async () => {
    const { api } = templatesApi([template('a', 'Alpha')]);
    const { router, calls } = renderApp('/templates/a/edit', api);
    const user = userEvent.setup();
    const name = await screen.findByLabelText('Name');
    expect(screen.getByLabelText('Id')).toBeDisabled();
    await user.clear(name);
    await user.type(name, 'Alpha 2');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/templates'),
    );
    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.path).toBe('admin/templates/a');
    expect(put?.body).toMatchObject({
      name: 'Alpha 2',
      exercises: [{ id: 'squat', reps: 12 }],
    });
    expect(put?.body).not.toHaveProperty('id');
  });

  it('switches an exercise to timed', async () => {
    const { api } = templatesApi([template('a', 'Alpha')]);
    const { calls } = renderApp('/templates/a/edit', api);
    const user = userEvent.setup();
    await user.click(await screen.findByText('Timed'));
    const seconds = screen.getByLabelText('Seconds of exercise 1');
    await user.clear(seconds);
    await user.type(seconds, '45');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({
        exercises: [{ id: 'squat', reps: 0, durationSeconds: 45 }],
      }),
    );
  });

  it('edits a template whose id is "new"', async () => {
    const { api } = templatesApi([template('new', 'New')]);
    const { calls } = renderApp('/templates', api);
    await userEvent.click(await screen.findByRole('link', { name: 'New' }));
    expect(await screen.findByLabelText('Id')).toHaveValue('new');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(calls.find((call) => call.method === 'PUT')?.path).toBe(
        'admin/templates/new',
      ),
    );
  });

  it('checks the amount against the new type when it switches', async () => {
    const { api } = templatesApi([
      {
        ...template('a', 'Alpha'),
        exercises: [{ ...exercise, reps: 0, durationSeconds: 300 }],
      },
    ]);
    renderApp('/templates/a/edit', api);
    const user = userEvent.setup();
    expect(await screen.findByLabelText('Seconds of exercise 1')).toHaveValue(
      '300',
    );
    await user.click(screen.getByText('Reps'));
    expect(await screen.findByText('1–200 reps')).toBeInTheDocument();
  });

  it('says when a template does not exist', async () => {
    renderApp('/templates/missing/edit', templatesApi([]).api);
    expect(await screen.findByText('Template not found')).toBeVisible();
  });
});
