import { USER_STATUSES, type UserQuery, type UserStatus } from './types';

const LIMITS = [10, 20, 50, 100];

/** The list's filters from `?q=&status=&page=&limit=`, invalid ones ignored. */
export function parseUserQuery(params: URLSearchParams): UserQuery {
  const status = params.get('status') as UserStatus | null;
  const page = Number(params.get('page'));
  const limit = Number(params.get('limit'));
  return {
    search: (params.get('q') ?? '').trim().slice(0, 100),
    status: status && USER_STATUSES.includes(status) ? status : 'all',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITS.includes(limit) ? limit : 20,
  };
}
