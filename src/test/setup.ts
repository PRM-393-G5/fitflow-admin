import '@testing-library/jest-dom/vitest';
import { toast } from '@heroui/react';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// CI runners are slower than a laptop: lazy routes, antd and the search
// debounce together can take longer than the 1 s default to settle.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
  // HeroUI keeps toasts in a module-level queue: one test's must not
  // show up in the next.
  toast.clear();
});

// jsdom lacks the browser APIs antd's responsive components use.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
