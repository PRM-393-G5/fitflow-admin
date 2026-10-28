import { SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Card,
  Input,
  Segmented,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { formatDateTime } from '../../format';
import { useUsers } from './api';
import { userPath, type FromList } from './paths';
import { StatusTag } from './StatusTag';
import { parseUserQuery } from './query';
import type { UserStatus, UserSummary } from './types';

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
  if (query.search !== searchFrom) {
    setSearchFrom(query.search);
    setSearch(query.search);
  }
  const listSearch = useLocation().search;
  const columns = useMemo(() => columnsFor(listSearch), [listSearch]);

  /** Writes [changes] to the URL; any filter change goes back to page 1. */
  const update = useCallback(
    (changes: Record<string, string>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = !value || (key === 'page' && value === '1');
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
    const timer = setTimeout(
      () => update({ q: search.trim() }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search, query.search, update]);

  return (
    <>
      <div className="page-header">
        <div>
          <Typography.Title level={2}>Users</Typography.Title>
          <Typography.Text type="secondary">
            Everyone who has signed in to the FitFlow app.
          </Typography.Text>
        </div>
      </div>
      {users.isError && (
        <Alert
          type="error"
          showIcon
          title={users.error.message}
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search email or name"
            aria-label="Search users"
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 280 }}
          />
          <Segmented<UserStatus>
            value={query.status}
            onChange={(status) =>
              update({ status: status === 'all' ? '' : status })
            }
            options={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Locked', value: 'locked' },
            ]}
          />
        </Space>
        <Table<UserSummary>
          rowKey="id"
          columns={columns}
          dataSource={users.data?.items}
          loading={users.isFetching}
          onRow={(user) => ({
            onClick: (event) => {
              // Links inside the row navigate on their own.
              if ((event.target as HTMLElement).closest('a')) return;
              navigate(userPath(user.id), {
                state: { listSearch } satisfies FromList,
              });
            },
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: users.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `${total} users`,
            onChange: (page, limit) =>
              update({ page: String(page), limit: String(limit) }),
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </>
  );
}

/** The table's columns; links carry [listSearch] to the user's page. */
function columnsFor(listSearch: string): ColumnsType<UserSummary> {
  return [
    {
      title: 'User',
      key: 'user',
      render: (_, user) => (
        <Space>
          <Avatar src={user.photoUrl ?? undefined}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Link
              to={userPath(user.id)}
              state={{ listSearch } satisfies FromList}
            >
              {user.name || user.email}
            </Link>
            {user.name && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {user.email}
              </Typography.Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'disabled',
      render: (disabled: boolean) => <StatusTag disabled={disabled} />,
    },
    { title: 'Workouts', dataIndex: 'sessionCount', align: 'right' },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: 'Last sign-in',
      dataIndex: 'lastSignInAt',
      render: (at: string | null) => (at ? formatDateTime(at) : '—'),
    },
  ];
}
