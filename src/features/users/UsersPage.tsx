import { SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Card,
  Input,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { formatDateTime } from '../../format';
import { useUsers } from './api';
import { userPath } from './paths';
import { parseUserQuery } from './query';
import type { UserStatus, UserSummary } from './types';

const SEARCH_DELAY_MS = 300;

export function UsersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = parseUserQuery(params);
  const users = useUsers(query);
  const [search, setSearch] = useState(query.search);

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

  // Search as the admin types, once they pause.
  useEffect(() => {
    if (search.trim() === query.search) return;
    const timer = setTimeout(
      () => update({ q: search.trim() }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search, query.search, update]);

  const columns: ColumnsType<UserSummary> = [
    {
      title: 'User',
      key: 'user',
      render: (_, user) => (
        <Space>
          <Avatar src={user.photoUrl ?? undefined}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </Avatar>
          <Space orientation="vertical" size={0}>
            <Link to={userPath(user.id)}>{user.name || user.email}</Link>
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
      render: (disabled: boolean) =>
        disabled ? (
          <Tag color="red">Locked</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
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
              navigate(userPath(user.id));
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
