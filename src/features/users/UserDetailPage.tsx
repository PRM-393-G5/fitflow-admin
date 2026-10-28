import {
  ArrowLeftOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Result,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { formatDateTime } from '../../format';
import { useDeleteUser, useSetUserLocked, useUser } from './api';
import {
  activityLabel,
  formatKg,
  formatMinutes,
  goalLabel,
  sexLabel,
} from './labels';
import { usersListPath } from './paths';
import { StatusTag } from './StatusTag';
import type { RecentSession, TrainingProfile, UserDetail } from './types';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const user = useUser(id);
  const backTo = usersListPath(useLocation().state);

  if (user.isPending) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (user.isError && !user.data) {
    const notFound =
      user.error instanceof ApiError && user.error.status === 404;
    return (
      <Result
        status={notFound ? '404' : 'error'}
        title={notFound ? 'User not found' : user.error.message}
        extra={<Link to={backTo}>Back to users</Link>}
      />
    );
  }
  return (
    <>
      {user.isError && (
        <Alert
          type="warning"
          showIcon
          title={`Could not refresh this user: ${user.error.message}`}
          style={{ marginBottom: 16 }}
        />
      )}
      <UserDetailView user={user.data} backTo={backTo} />
    </>
  );
}

function UserDetailView({
  user,
  backTo,
}: {
  user: UserDetail;
  backTo: string;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const setLocked = useSetUserLocked(user.id);
  const remove = useDeleteUser(user.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const shownName = user.name || user.email;

  const toggleLock = () =>
    setLocked.mutateAsync(!user.disabled).then(
      () =>
        message.success(
          user.disabled ? `Unlocked ${shownName}` : `Locked ${shownName}`,
        ),
      (error: Error) => message.error(error.message),
    );

  return (
    <>
      <div className="page-header">
        <Space align="center" size="middle">
          <Link to={backTo} aria-label="Back to users">
            <ArrowLeftOutlined />
          </Link>
          <Avatar size={48} src={user.photoUrl ?? undefined}>
            {shownName.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {shownName} <StatusTag disabled={user.disabled} />
            </Typography.Title>
            {user.name && (
              <Typography.Text type="secondary">{user.email}</Typography.Text>
            )}
          </div>
        </Space>
        <Space>
          <Popconfirm
            title={
              user.disabled ? 'Unlock this account?' : 'Lock this account?'
            }
            description={
              user.disabled
                ? 'They can sign in again; their data is unchanged.'
                : 'They are signed out everywhere and cannot sign in or sync.'
            }
            okText={user.disabled ? 'Unlock' : 'Lock'}
            okButtonProps={{ danger: !user.disabled }}
            onConfirm={toggleLock}
          >
            <Button
              icon={user.disabled ? <UnlockOutlined /> : <LockOutlined />}
              loading={setLocked.isPending}
            >
              {user.disabled ? 'Unlock' : 'Lock'}
            </Button>
          </Popconfirm>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              remove.reset(); // no error left from an earlier attempt
              setConfirmingDelete(true);
            }}
          >
            Delete
          </Button>
        </Space>
      </div>

      {user.disabled && (
        <Alert
          type="warning"
          showIcon
          title="This account is locked: the user cannot sign in, sync or use AI."
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="Workouts" value={user.counts.sessions} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="Training time"
              value={formatMinutes(user.totals.minutes)}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="Volume" value={formatKg(user.totals.volumeKg)} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="Form checks" value={user.counts.formChecks} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Account" style={{ height: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Joined">
                {formatDateTime(user.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Last sign-in">
                {user.lastSignInAt ? formatDateTime(user.lastSignInAt) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Last sync">
                {user.lastSyncAt ? formatDateTime(user.lastSyncAt) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Custom plans">
                {user.counts.workouts}
              </Descriptions.Item>
              <Descriptions.Item label="Weight entries">
                {user.counts.weights}
                {user.latestWeightKg !== null &&
                  ` (latest ${formatKg(user.latestWeightKg)})`}
              </Descriptions.Item>
              <Descriptions.Item label="Meals logged">
                {user.counts.meals}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Training profile" style={{ height: '100%' }}>
            <ProfileDetails profile={user.profile} />
          </Card>
        </Col>
      </Row>

      <Card title="Recent sessions">
        <Table<RecentSession>
          rowKey="id"
          columns={sessionColumns}
          dataSource={user.recentSessions}
          pagination={false}
          locale={{ emptyText: 'No sessions synced yet' }}
          scroll={{ x: 640 }}
        />
      </Card>

      <DeleteUserModal
        open={confirmingDelete}
        email={user.email}
        deleting={remove.isPending}
        error={remove.error?.message}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              message.success(`Deleted ${shownName}`);
              navigate(backTo, { replace: true });
            },
          })
        }
      />
    </>
  );
}

function ProfileDetails({ profile }: { profile: TrainingProfile | null }) {
  if (!profile) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Not set up in the app yet"
      />
    );
  }
  const show = <T,>(value: T | null, format: (value: T) => string) =>
    value === null ? '—' : format(value);
  return (
    <Descriptions column={1} size="small">
      <Descriptions.Item label="Goal">
        {show(profile.goal, goalLabel)}
      </Descriptions.Item>
      <Descriptions.Item label="Level">
        {show(profile.level, String)}
      </Descriptions.Item>
      <Descriptions.Item label="Weekly goal">
        {show(profile.weeklyGoal, (n) => `${n} workouts`)}
      </Descriptions.Item>
      <Descriptions.Item label="Height">
        {show(profile.heightCm, (n) => `${n} cm`)}
      </Descriptions.Item>
      <Descriptions.Item label="Age">
        {show(profile.age, String)}
      </Descriptions.Item>
      <Descriptions.Item label="Sex">
        {show(profile.isMale, sexLabel)}
      </Descriptions.Item>
      <Descriptions.Item label="Activity">
        {show(profile.activityLevel, activityLabel)}
      </Descriptions.Item>
    </Descriptions>
  );
}

const sessionColumns: ColumnsType<RecentSession> = [
  {
    title: 'Workout',
    key: 'workout',
    render: (_, session) => (
      <Space>
        {session.workoutName ?? 'Workout'}
        {session.formCheck && <Tag color="purple">Form check</Tag>}
      </Space>
    ),
  },
  {
    title: 'Finished',
    dataIndex: 'completedAt',
    // The phone's local time: shown as is, not converted.
    render: (at: string | null) => (at ? formatDateTime(at) : '—'),
  },
  {
    title: 'Duration',
    dataIndex: 'minutes',
    render: (minutes: number) => formatMinutes(minutes),
  },
  { title: 'Sets', dataIndex: 'completedSets', align: 'right' },
  {
    title: 'Volume',
    dataIndex: 'volumeKg',
    align: 'right',
    render: (kg: number) => formatKg(kg),
  },
];

/** Deleting cannot be undone, so the admin types the email to confirm. */
function DeleteUserModal({
  open,
  email,
  deleting,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  email: string;
  deleting: boolean;
  error: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toLowerCase() === email.toLowerCase();
  return (
    <Modal
      open={open}
      title="Delete this account?"
      okText="Delete account"
      okButtonProps={{ danger: true, disabled: !matches, loading: deleting }}
      onOk={onConfirm}
      onCancel={onCancel}
      afterClose={() => setTyped('')}
    >
      <Typography.Paragraph>
        This permanently deletes the account and everything it synced (workouts,
        plans, weights, meals). It cannot be undone.
      </Typography.Paragraph>
      <Typography.Paragraph>
        Type <Typography.Text strong>{email}</Typography.Text> to confirm.
      </Typography.Paragraph>
      <Input
        aria-label="Email to confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
      />
      {error && (
        <Alert type="error" showIcon title={error} style={{ marginTop: 12 }} />
      )}
    </Modal>
  );
}
