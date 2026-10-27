import { Card, Label, Link, ListBox, Select, Spinner } from '@heroui/react';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { formatDateTime, formatExact } from '../../format';
import { DataTable, type Column } from '../../ui/DataTable';
import { Dimmed, EmptyRows, Notice } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { Pager } from '../../ui/Pager';
import { Segmented } from '../../ui/Segmented';
import { useUsers } from './api';
import { userPath, type FromList } from './paths';
import { DEFAULT_LIMIT, PAGE_SIZES, parseUserQuery } from './query';
import { StatusTag } from './StatusTag';
import type { UserStatus, UserSummary } from './types';
import { UserAvatar } from './UserAvatar';
import { UserSearch } from './UserSearch';

export function UsersPage() {
  const [params, setParams] = useSearchParams();
  const query = parseUserQuery(params);
  const users = useUsers(query);
  const listSearch = useLocation().search;
  const columns = useMemo(() => columnsFor({ listSearch }), [listSearch]);

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
  const onSearch = useCallback((q: string) => update({ q }), [update]);

  // A page past the end (after deletions, or an old bookmark): go to the
  // last one.
  const total = users.isPlaceholderData ? undefined : users.data?.total;
  useEffect(() => {
    if (total === undefined) return;
    const lastPage = Math.max(1, Math.ceil(total / query.limit));
    if (query.page > lastPage) update({ page: String(lastPage) });
  }, [total, query.page, query.limit, update]);

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
          <UserSearch value={query.search} onSearch={onSearch} />
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
          {/* Refreshing; the first load shows its spinner in the table. */}
          {users.isFetching && !users.isPending && (
            <Spinner size="sm" aria-label="Loading users" />
          )}
        </div>
        <Dimmed when={users.isPlaceholderData}>
          <DataTable
            label="Users"
            contentClassName="min-w-[760px]"
            rows={items}
            rowKey={(user) => user.id}
            rowHref={(user) => userPath(user.id)}
            rowRouterOptions={() => ({ state: { listSearch } })}
            empty={
              users.isPending ? (
                <div className="flex justify-center py-10">
                  <Spinner aria-label="Loading users" />
                </div>
              ) : users.isError ? (
                <EmptyRows>The list could not be loaded.</EmptyRows>
              ) : (
                <EmptyRows>No users match these filters</EmptyRows>
              )
            }
            columns={columns}
            footer={
              users.data &&
              !users.isError && (
                <div className="flex w-full flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <Pager
                      page={query.page}
                      pageSize={query.limit}
                      total={users.data.total}
                      onChange={(page) => update({ page: String(page) })}
                      noun="users"
                    />
                  </div>
                  <Select
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
              )
            }
          />
        </Dimmed>
      </Card>
    </>
  );
}

/** The table's columns; links carry the list's filters to a user's page. */
function columnsFor(fromList: FromList): Column<UserSummary>[] {
  return [
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
            {/* The row is a link too; this one is what screen readers find. */}
            <Link href={userPath(user.id)} routerOptions={{ state: fromList }}>
              {user.name || user.email}
            </Link>
            {user.name && (
              <div className="truncate text-xs text-muted">{user.email}</div>
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
      render: (user) => formatExact(user.sessionCount),
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
  ];
}
