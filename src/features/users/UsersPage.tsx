import {
  Card,
  Label,
  Link,
  ListBox,
  SearchField,
  Select,
  Spinner,
} from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { formatCount } from '../../charts/tokens';
import { formatDateTime } from '../../format';
import { DataTable } from '../../ui/DataTable';
import { EmptyRows, Notice } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { Pager } from '../../ui/Pager';
import { Segmented } from '../../ui/Segmented';
import { useUsers } from './api';
import { userPath, type FromList } from './paths';
import { DEFAULT_LIMIT, PAGE_SIZES, parseUserQuery } from './query';
import { StatusTag } from './StatusTag';
import type { UserStatus } from './types';
import { UserAvatar } from './UserAvatar';

const SEARCH_DELAY_MS = 300;

export function UsersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = parseUserQuery(params);
  const users = useUsers(query);
  const [search, setSearch] = useState(query.search);
  // Back, or the sidebar link, can change the URL's search: follow it
  // (adjusting state during render, as React recommends).
  const [searchFrom, setSearchFrom] = useState(query.search);
  // The search our debounce last wrote: its URL update can land after the
  // admin typed more, and must not wipe those keystrokes.
  const [written, setWritten] = useState<string | null>(null);
  if (query.search !== searchFrom) {
    setSearchFrom(query.search);
    if (query.search === written) {
      // Our write has landed; from now on this value is like any other.
      setWritten(null);
    } else if (search.trim() !== query.search) {
      setSearch(query.search);
    }
  }
  const listSearch = useLocation().search;
  const fromList: FromList = { listSearch };

  /** Writes [changes] to the URL; any filter change goes back to page 1. */
  const update = useCallback(
    (changes: Record<string, string>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault =
              !value ||
              (key === 'page' && value === '1') ||
              (key === 'limit' && value === String(DEFAULT_LIMIT));
            if (isDefault) next.delete(key);
            else next.set(key, value);
          }
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  // A page past the end (after deletions, or an old bookmark): go to the
  // last one.
  const total = users.isPlaceholderData ? undefined : users.data?.total;
  useEffect(() => {
    if (total === undefined) return;
    const lastPage = Math.max(1, Math.ceil(total / query.limit));
    if (query.page > lastPage) update({ page: String(lastPage) });
  }, [total, query.page, query.limit, update]);

  // Search as the admin types, once they pause.
  useEffect(() => {
    if (search.trim() === query.search) return;
    const timer = setTimeout(() => {
      setWritten(search.trim());
      update({ q: search.trim() });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, query.search, update]);

  // A failed load for new filters must not show the old rows.
  const items = users.isError ? [] : (users.data?.items ?? []);

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has signed in to the FitFlow app."
      />
      {users.isError && <Notice status="danger" title={users.error.message} />}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            aria-label="Search users"
            value={search}
            onChange={setSearch}
            maxLength={100}
            className="w-full sm:w-72"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search email or name" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Segmented<UserStatus>
            ariaLabel="Status"
            size="md"
            value={query.status}
            onChange={(status) =>
              update({ status: status === 'all' ? '' : status })
            }
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'locked', label: 'Locked' },
            ]}
          />
          {users.isFetching && <Spinner size="sm" aria-label="Loading users" />}
        </div>
        <DataTable
          label="Users"
          className={`transition-opacity ${users.isPlaceholderData ? 'opacity-55' : ''}`}
          contentClassName="min-w-[760px]"
          rows={items}
          rowKey={(user) => user.id}
          onRowAction={(id) =>
            navigate(userPath(String(id)), { state: fromList })
          }
          empty={
            users.isPending ? (
              <div className="flex justify-center py-10">
                <Spinner aria-label="Loading users" />
              </div>
            ) : (
              <EmptyRows>No users match these filters</EmptyRows>
            )
          }
          columns={[
            {
              title: 'User',
              render: (user) => (
                <div className="flex items-center gap-3">
                  <UserAvatar
                    size="sm"
                    name={user.name || user.email}
                    photoUrl={user.photoUrl}
                  />
                  <div className="min-w-0">
                    {/* Its own link: a new tab, or a screen reader. */}
                    <Link
                      href={userPath(user.id)}
                      routerOptions={{ state: fromList }}
                    >
                      {user.name || user.email}
                    </Link>
                    {user.name && (
                      <div className="truncate text-xs text-muted">
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              title: 'Status',
              render: (user) => <StatusTag disabled={user.disabled} />,
            },
            {
              title: 'Workouts',
              numeric: true,
              render: (user) => formatCount(user.sessionCount),
            },
            {
              title: 'Joined',
              className: 'tabular whitespace-nowrap',
              render: (user) => formatDateTime(user.createdAt),
            },
            {
              title: 'Last sign-in',
              className: 'tabular whitespace-nowrap',
              render: (user) =>
                user.lastSignInAt ? formatDateTime(user.lastSignInAt) : '—',
            },
          ]}
          footer={
            <div className="flex w-full flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <Pager
                  page={query.page}
                  pageSize={query.limit}
                  total={users.isError ? 0 : (users.data?.total ?? 0)}
                  onChange={(page) => update({ page: String(page) })}
                  noun="users"
                />
              </div>
              <Select
                aria-label="Users per page"
                className="w-36"
                value={query.limit}
                onChange={(limit) => update({ limit: String(limit) })}
              >
                <Label className="sr-only">Users per page</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PAGE_SIZES.map((size) => (
                      <ListBox.Item
                        key={size}
                        id={size}
                        textValue={`${size} per page`}
                      >
                        {size} per page
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          }
        />
      </Card>
    </>
  );
}
