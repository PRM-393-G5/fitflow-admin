import {
  Camera,
  Clock,
  Flame,
  LayoutHeaderCellsLarge,
  Persons,
  Pulse,
  Sparkles,
} from '@gravity-ui/icons';
import { Chip, Link } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { displayName } from '../auth/session';
import { useApi, useAuth } from '../auth/useAuth';
import { DailyBarChart } from '../charts/DailyBarChart';
import { DailyTable } from '../charts/DailyTable';
import { formatCount, formatDay, useChartTokens } from '../charts/tokens';
import { useOverview } from '../features/stats/api';
import { DEFAULT_DAYS, useRangeDays } from '../features/stats/range';
import { RangeFilter } from '../features/stats/RangeFilter';
import type { DailyActivity } from '../features/stats/types';
import { formatMinutes } from '../features/users/labels';
import { ChartCard } from '../ui/ChartCard';
import { Dimmed, Notice, ReportSkeleton } from '../ui/feedback';
import { PageHeader } from '../ui/PageHeader';
import { StatTile } from '../ui/StatTile';

function StatusChip({
  color,
  children,
}: {
  color: 'default' | 'success' | 'warning' | 'danger';
  children: string;
}) {
  return (
    <Chip color={color} variant="soft">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
}

function ApiStatus() {
  const api = useApi();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('health'),
    retry: false,
  });
  if (health.isPending)
    return <StatusChip color="default">Checking…</StatusChip>;
  if (health.isError) {
    // The API answers 503 when it is up but its database is not.
    return health.error instanceof ApiError && health.error.status === 503 ? (
      <StatusChip color="warning">API up, database unreachable</StatusChip>
    ) : (
      <StatusChip color="danger">{health.error.message}</StatusChip>
    );
  }
  return <StatusChip color="success">API ok, database up</StatusChip>;
}

export function DashboardPage() {
  const { session } = useAuth();
  const [days, setDays] = useRangeDays();
  const overview = useOverview(days);
  const data = overview.data;
  const CHART = useChartTokens();

  return (
    <>
      <PageHeader
        title={`Welcome, ${session ? displayName(session.admin) : ''}`}
        description="FitFlow at a glance"
        actions={<ApiStatus />}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <RangeFilter days={days} onChange={setDays} />
        {data && (
          <span className="text-sm text-muted">
            {formatDay(data.range.from)} – {formatDay(data.range.to)} ·{' '}
            {data.range.tz}
          </span>
        )}
      </div>

      {overview.isError && (
        <Notice status="danger" title={overview.error.message} />
      )}

      {!data ? (
        overview.isPending && <ReportSkeleton />
      ) : (
        <Dimmed when={overview.isPlaceholderData}>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatTile
              label="Users"
              icon={<Persons />}
              value={formatCount(data.users.total)}
              note={`${formatCount(data.users.new)} new · ${formatCount(data.users.locked)} locked`}
            />
            <StatTile
              label="Active users"
              icon={<Pulse />}
              value={formatCount(data.users.active)}
              note="Finished a workout or form check"
            />
            <StatTile
              label="Workouts"
              icon={<Flame />}
              value={formatCount(data.sessions.inRange)}
              note={`${formatCount(data.sessions.total)} all time`}
            />
            <StatTile
              label="Training time"
              icon={<Clock />}
              value={formatMinutes(data.sessions.minutesInRange)}
              note="Across all workouts"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <StatTile
              label="Form checks"
              icon={<Camera />}
              tone="default"
              value={formatCount(data.sessions.formChecksInRange)}
            />
            <StatTile
              label="AI calls"
              icon={<Sparkles />}
              tone="default"
              value={formatCount(data.ai.calls)}
              note={
                <Link
                  className="text-xs"
                  href={`/ai${days === DEFAULT_DAYS ? '' : `?days=${days}`}`}
                >
                  {formatCount(data.ai.errors)} failed · details
                </Link>
              }
            />
            <StatTile
              label="Workout templates"
              icon={<LayoutHeaderCellsLarge />}
              tone="default"
              value={formatCount(data.templates)}
              note={
                <Link className="text-xs" href="/templates">
                  Manage
                </Link>
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <ChartCard
                title="Workouts per day"
                description="Finished workouts and form checks"
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
                    label="Workouts per day"
                    rows={data.daily}
                    columns={[
                      ['sessions', 'Workouts'],
                      ['formChecks', 'Form checks'],
                    ]}
                  />
                }
              />
            </div>
            <div className="xl:col-span-5">
              <ChartCard
                title="New users per day"
                description="Accounts created"
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
                    label="New users per day"
                    rows={data.daily}
                    columns={[['newUsers', 'New users']]}
                  />
                }
              />
            </div>
          </div>
        </Dimmed>
      )}
    </>
  );
}
