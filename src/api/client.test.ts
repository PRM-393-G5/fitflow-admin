import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

function client(
  respond: () => Response | Promise<Response>,
  token: string | null = 'token-1',
) {
  const fetch = vi.fn(async () => respond());
  const onUnauthorized = vi.fn();
  const api = createApiClient({
    baseUrl: 'http://api.test/api',
    getToken: () => token,
    onUnauthorized,
    fetch: fetch as unknown as typeof globalThis.fetch,
  });
  return { api, fetch, onUnauthorized };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

describe('createApiClient', () => {
  it('sends the token and a JSON body to the resolved URL', async () => {
    const { api, fetch } = client(() => json(200, { ok: true }));
    await expect(api.post('/admin/things', { a: 1 })).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith('http://api.test/api/admin/things', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-1',
      },
      body: '{"a":1}',
    });
  });

  it('returns undefined for 204', async () => {
    const { api } = client(() => new Response(null, { status: 204 }));
    await expect(api.delete('admin/things/1')).resolves.toBeUndefined();
  });

  it('carries the API message, joining validation lists', async () => {
    const one = client(() =>
      json(409, { message: 'Template x already exists' }),
    );
    await expect(one.api.get('x')).rejects.toMatchObject({
      status: 409,
      message: 'Template x already exists',
    });
    const many = client(() =>
      json(400, { message: ['name is empty', 'id bad'] }),
    );
    await expect(many.api.get('x')).rejects.toMatchObject({
      message: 'name is empty\nid bad',
    });
    const plain = client(() => new Response('oops', { status: 502 }));
    await expect(plain.api.get('x')).rejects.toMatchObject({
      message: 'Request failed (502)',
    });
  });

  it('reports an unreachable server as status 0', async () => {
    const { api } = client(() => {
      throw new TypeError('Failed to fetch');
    });
    const error = await api.get('x').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
  });

  it('ends the session only when a sent token is rejected', async () => {
    const signedIn = client(() => json(401, { message: 'expired' }));
    await expect(signedIn.api.get('x')).rejects.toBeInstanceOf(ApiError);
    expect(signedIn.onUnauthorized).toHaveBeenCalledOnce();

    const login = client(() => json(401, { message: 'wrong' }), null);
    await expect(login.api.post('admin/auth/login', {})).rejects.toThrow();
    expect(login.onUnauthorized).not.toHaveBeenCalled();
  });
});
