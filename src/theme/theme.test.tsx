import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp, signIn } from '../test/render';
import { applyTheme, loadThemeMode, resolveTheme } from './mode';

const root = document.documentElement;

describe('theme', () => {
  beforeEach(signIn);
  afterEach(() => applyTheme('light'));

  it('follows the system until a theme is picked', () => {
    expect(loadThemeMode()).toBe('system');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('switches from the sidebar and remembers the choice', async () => {
    renderApp('/', {
      'GET health': () => ({ status: 200, body: { status: 'ok' } }),
    });
    await userEvent.click(
      await screen.findByRole('radio', { name: 'Dark theme' }),
    );
    expect(root.dataset.theme).toBe('dark');
    expect(root).toHaveClass('dark');
    expect(localStorage.getItem('fitflow-admin.theme')).toBe('dark');

    // The narrow sidebar's single button steps on to the next mode.
    await userEvent.click(
      screen.getByRole('button', { name: /^Dark theme\. Switch to/ }),
    );
    expect(localStorage.getItem('fitflow-admin.theme')).toBe('system');
    expect(root.dataset.theme).toBe('light');
  });

  it('follows a theme picked in another tab', async () => {
    renderApp('/', {
      'GET health': () => ({ status: 200, body: { status: 'ok' } }),
    });
    await screen.findByRole('radio', { name: 'Dark theme' });
    localStorage.setItem('fitflow-admin.theme', 'dark');
    act(() => {
      dispatchEvent(
        new StorageEvent('storage', { key: 'fitflow-admin.theme' }),
      );
    });
    expect(root.dataset.theme).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Dark theme' })).toBeChecked();
  });
});
