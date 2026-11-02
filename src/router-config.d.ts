import type { NavigateOptions } from 'react-router';

// HeroUI links and rows navigate through React Router (see AriaRouter),
// so they take its options, e.g. `routerOptions={{ state }}`.
declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}
