import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Col, Row, Skeleton, Typography } from 'antd';
import { Link } from 'react-router';
import { ApiError } from '../api/client';
import { displayName } from '../auth/session';
import { useApi, useAuth } from '../auth/useAuth';
import { ChartCard } from '../charts/ChartCard';
import { DailyBarChart } from '../charts/DailyBarChart';
import { StatTile } from '../charts/StatTile';
import { CHART, formatCount, formatDay } from '../charts/tokens';
import { useOverview } from '../features/stats/api';
import { DailyTable } from '../charts/DailyTable';
import { DEFAULT_DAYS, useRangeDays } from '../features/stats/range';
import { RangeFilter } from '../features/stats/RangeFilter';
import type { DailyActivity } from '../features/stats/types';
import { formatMinutes } from '../features/users/labels';

function ApiStatus() {
  const api = useApi();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('health'),
    retry: false,
  });
  if (health.isPending) return <Badge status="processing" text="Checking…" />;
  if (health.isError) {
    // The API answers 503 when it is up but its database is not.
    return health.error instanceof ApiError && health.error.status === 503 ? (
      <Badge status="warning" text="API up, database unreachable" />
    ) : (
      <Badge status="error" text={health.error.message} />
    );
  }
  return <Badge status="success" text="API ok, database up" />;
}

export function DashboardPage() {
  const { session } = useAuth();
  const [days, setDays] = useRangeDays();
  const overview = useOverview(days);
  const data = overview.data;

  return (
    <>
      <div className="page-header">
        <div>
          <Typography.Title level={2}>
            Welcome, {session && displayName(session.admin)}
          </Typography.Title>
          <Typography.Text type="secondary">
            {data
              ? `${formatDay(data.range.from)} – ${formatDay(data.range.to)} · ${data.range.tz}`
              : 'FitFlow at a glance'}
          </Typography.Text>
        </div>
        <ApiStatus />
      </div>

      <div className="filter-row">
        <RangeFilter days={days} onChange={setDays} />
      </div>

      {overview.isError && (
        <Alert
          type="error"
          showIcon
          title={overview.error.message}
          style={{ marginBottom: 16 }}
        />
      )}

      {!data ? (
        overview.isPending && <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div
          style={{
            opacity: overview.isPlaceholderData ? 0.55 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Users"
                value={formatCount(data.users.total)}
                note={`${formatCount(data.users.new)} new · ${formatCount(data.users.locked)} locked`}
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Active users"
                value={formatCount(data.users.active)}
                note="Finished a workout or form check"
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Workouts"
                value={formatCount(data.sessions.inRange)}
                note={`${formatCount(data.sessions.total)} all time`}
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Training time"
                value={formatMinutes(data.sessions.minutesInRange)}
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Form checks"
                value={formatCount(data.sessions.formChecksInRange)}
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="AI calls"
                value={formatCount(data.ai.calls)}
                note={
                  <Link
                    to={`/ai${days === DEFAULT_DAYS ? '' : `?days=${days}`}`}
                  >
                    {formatCount(data.ai.errors)} failed · details
                  </Link>
                }
              />
            </Col>
            <Col xs={12} md={8} xl={6}>
              <StatTile
                label="Workout templates"
                value={formatCount(data.templates)}
                note={<Link to="/templates">Manage</Link>}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <ChartCard
                title="Workouts per day"
                chart={
                  <DailyBarChart<DailyActivity>
                    data={data.daily}
                    series={[
                      {
                        key: 'sessions',
                        label: 'Workouts',
                        color: CHART.series1,
                      },
                      {
                        key: 'formChecks',
                        label: 'Form checks',
                        color: CHART.series2,
                      },
                    ]}
                  />
                }
                table={
                  <DailyTable
                    rows={data.daily}
                    columns={[
                      ['sessions', 'Workouts'],
                      ['formChecks', 'Form checks'],
                    ]}
                  />
                }
              />
            </Col>
            <Col xs={24} xl={10}>
              <ChartCard
                title="New users per day"
                chart={
                  <DailyBarChart<DailyActivity>
                    data={data.daily}
                    series={[
                      {
                        key: 'newUsers',
                        label: 'New users',
                        color: CHART.series1,
                      },
                    ]}
                  />
                }
                table={
                  <DailyTable
                    rows={data.daily}
                    columns={[['newUsers', 'New users']]}
                  />
                }
              />
            </Col>
          </Row>
        </div>
      )}
    </>
  );
}
