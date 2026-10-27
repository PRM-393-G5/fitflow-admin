import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '../providers';
import { createQueryClient } from '../queryClient';
import { routes } from '../routes';

/** A fetch stub answering by `METHOD path` (path after `/api/`). */
export type FakeApi = Record<
  string,
  (body: unknown) => { status: number; body?: unknown }
>;

export function fakeFetch(api: FakeApi) {
  const calls: Array<{
    method: string;
    path: string;
    body: unknown;
    auth?: string;
  }> = [];
  const impl = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/api\//, '') + url.search;
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ method, path, body, auth: headers.Authorization });
    const handler = api[`${method} ${path}`];
    const answer = handler
      ? handler(body)
      : { status: 404, body: { message: `No fake for ${method} ${path}` } };
    return new Response(
      answer.body === undefined ? null : JSON.stringify(answer.body),
      {
        status: answer.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };
  return { impl: impl as typeof fetch, calls };
}

/** The whole app at [path], talking to [api]. */
export function renderApp(path: string, api: FakeApi = {}) {
  const fetch = fakeFetch(api);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <Providers queryClient={createQueryClient()} fetchImpl={fetch.impl}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...view, router, calls: fetch.calls };
}
