import { describe, expect, it } from 'vitest';
import { userListPath } from './api';
import { parseUserQuery } from './query';

describe('parseUserQuery', () => {
  it('reads the filters, falling back to defaults for bad values', () => {
    expect(parseUserQuery(new URLSearchParams())).toEqual({
      search: '',
      status: 'all',
      page: 1,
      limit: 20,
    });
    expect(
      parseUserQuery(
        new URLSearchParams('q= bob &status=locked&page=3&limit=50'),
      ),
    ).toEqual({ search: 'bob', status: 'locked', page: 3, limit: 50 });
    expect(
      parseUserQuery(new URLSearchParams('status=banned&page=-1&limit=7')),
    ).toEqual({ search: '', status: 'all', page: 1, limit: 20 });
  });
});

describe('userListPath', () => {
  it('sends only the filters in use', () => {
    expect(
      userListPath({ search: '', status: 'all', page: 1, limit: 20 }),
    ).toBe('admin/users?page=1&limit=20');
    expect(
      userListPath({ search: ' a&b ', status: 'locked', page: 2, limit: 10 }),
    ).toBe('admin/users?page=2&limit=10&search=a%26b&status=locked');
  });
});
