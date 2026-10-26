/** A failed API call; [status] is 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiClientOptions {
  /** `.../api`, without a trailing slash. */
  baseUrl: string;
  /** The admin access token to send, if signed in. */
  getToken: () => string | null;
  /** Called when the API rejects the token (expired, or admin removed). */
  onUnauthorized: () => void;
  fetch?: typeof fetch;
}

/**
 * JSON client for the FitFlow API. Paths are relative to the base URL
 * (`admin/users`). Errors carry the API's `message`.
 */
export function createApiClient(options: ApiClientOptions) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const token = options.getToken();
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await (options.fetch ?? fetch)(
        `${options.baseUrl}/${path.replace(/^\/+/, '')}`,
        {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      );
    } catch {
      throw new ApiError(0, 'Cannot reach the FitFlow API');
    }
    // Only a rejected token ends the session; a failed login is just a 401.
    if (response.status === 401 && token) options.onUnauthorized();
    if (!response.ok) {
      throw new ApiError(response.status, await errorMessage(response));
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
    delete: (path: string) => request<void>('DELETE', path),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** The API's `{message}` (a string or a list of validation errors). */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (Array.isArray(body.message)) return body.message.join('\n');
    if (typeof body.message === 'string' && body.message) return body.message;
  } catch {
    // Not JSON: fall through.
  }
  return `Request failed (${response.status})`;
}
