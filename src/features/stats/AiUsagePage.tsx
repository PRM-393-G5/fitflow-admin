import { CircleXmark, Persons, Sparkles, Stopwatch } from '@gravity-ui/icons';
import { Chip, Link } from '@heroui/react';
import { useState } from 'react';
import { DailyBarChart } from '../../charts/DailyBarChart';
import { DailyTable } from '../../charts/DailyTable';
import { HorizontalBarChart } from '../../charts/HorizontalBarChart';
import { formatCount, formatDay, useChartTokens } from '../../charts/tokens';
import { formatDateTime } from '../../format';
import { ChartCard } from '../../ui/ChartCard';
import { DataTable } from '../../ui/DataTable';
import { Dimmed, EmptyRows, Notice, ReportSkeleton } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { Pager } from '../../ui/Pager';
import { pageCountOf } from '../../ui/pages';
import { SectionCard } from '../../ui/SectionCard';
import { StatTile } from '../../ui/StatTile';
import { userPath } from '../users/paths';
import { useAiUsage } from './api';
import { errorLabel, FEATURE_LABELS } from './labels';
import { RangeBar } from './RangeBar';
import { useRangeDays } from './range';
import type { AiFeature, AiUsageReport, AiUsageUser } from './types';

const RECENT_PAGE_SIZE = 10;

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const featureLabel = (feature: AiFeature) => FEATURE_LABELS[feature] ?? feature;

function UserCell({ user }: { user: AiUsageUser | null }) {
  if (!user || user.email === null) {
    return <span className="text-muted">Deleted account</span>;
  }
  return <Link href={userPath(user.id)}>{user.name || user.email}</Link>;
}

export function AiUsagePage() {
  const [days, setDays] = useRangeDays();
  const report = useAiUsage(days);
  const data = report.data;

  return (
    <>
      <PageHeader
        title="AI usage"
        description="Calls to the AI features, by feature, day and user. Prompts, photos and answers are never stored."
      />

      <RangeBar
        days={days}
        onChange={setDays}
        range={data?.range}
        isStale={report.isPlaceholderData}
      />

      {report.isError && (
        <Notice status="danger" title={report.error.message} />
      )}
      {data && !data.status.configured && (
        <Notice
          status="warning"
          title="OPENAI_API_KEY is not set on the API: every AI feature answers “not configured”."
        />
      )}

      {!data ? (
        report.isPending && <ReportSkeleton />
      ) : (
        <Dimmed when={report.isPlaceholderData}>
          <AiUsageContent data={data} />
        </Dimmed>
      )}
    </>
  );
}

function AiUsageContent({ data }: { data: AiUsageReport }) {
  const CHART = useChartTokens();
  const { totals } = data;
  const share = totals.calls > 0 ? (totals.errors / totals.calls) * 100 : 0;
  // A real but tiny share is "<1%", never a misleading "0%".
  const failedShare = share > 0 && share < 1 ? '<1' : String(Math.round(share));
  const daily = data.daily.map((day) => ({
    date: day.date,
    succeeded: day.calls - day.errors,
    failed: day.errors,
  }));
  const byFeature = data.byFeature.map((row) => ({
    label: featureLabel(row.feature),
    value: row.calls,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Calls"
          icon={<Sparkles />}
          value={formatCount(totals.calls)}
          note={`${formatDay(data.range.from)} – ${formatDay(data.range.to)}`}
        />
        <StatTile
          label="Failed"
          icon={<CircleXmark />}
          tone={totals.errors > 0 ? 'danger' : 'default'}
          value={formatCount(totals.errors)}
          note={`${failedShare}% of calls`}
        />
        <StatTile
          label="Users"
          icon={<Persons />}
          value={formatCount(totals.users)}
          note={
            totals.anonymousCalls > 0
              ? `+ ${formatCount(totals.anonymousCalls)} calls from deleted accounts`
              : 'Signed-in users who used AI'
          }
        />
        <StatTile
          label="Average duration"
          icon={<Stopwatch />}
          value={seconds(totals.avgDurationMs)}
          note={`Model ${data.status.model}`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ChartCard
            title="Calls per day"
            description="Succeeded and failed calls"
            chart={
              <DailyBarChart
                data={daily}
                series={[
                  {
                    key: 'succeeded',
                    label: 'Succeeded',
                    color: CHART.series1,
                  },
                  // Status colour: failures, always named in the legend.
                  { key: 'failed', label: 'Failed', color: CHART.critical },
                ]}
              />
            }
            table={
              <DailyTable
                label="Calls per day"
                rows={daily}
                columns={[
                  ['succeeded', 'Succeeded'],
                  ['failed', 'Failed'],
                ]}
              />
            }
          />
        </div>
        <div className="xl:col-span-5">
          <ChartCard
            title="Calls by feature"
            description="Which AI features are used"
            chart={
              byFeature.length > 0 ? (
                <HorizontalBarChart data={byFeature} valueLabel="Calls" />
              ) : (
                <EmptyRows>No AI calls in this range.</EmptyRows>
              )
            }
            table={
              <DataTable
                label="Calls by feature"
                rows={data.byFeature}
                rowKey={(row) => row.feature}
                empty="No AI calls in this range."
                columns={[
                  {
                    title: 'Feature',
                    render: (row) => featureLabel(row.feature),
                  },
                  {
                    title: 'Calls',
                    numeric: true,
                    render: (row) => formatCount(row.calls),
                  },
                  {
                    title: 'Failed',
                    numeric: true,
                    render: (row) => formatCount(row.errors),
                  },
                  {
                    title: 'Avg',
                    numeric: true,
                    render: (row) => seconds(row.avgDurationMs),
                  },
                ]}
              />
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Top users" description="Most calls in this range">
          <DataTable
            label="Top users"
            rows={data.topUsers}
            rowKey={(row) => row.id}
            empty="No signed-in calls in this range"
            columns={[
              { title: 'User', render: (row) => <UserCell user={row} /> },
              {
                title: 'Calls',
                numeric: true,
                render: (row) => formatCount(row.calls),
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Failures by cause" description="Why calls failed">
          <DataTable
            label="Failures by cause"
            rows={data.errorsByCode}
            rowKey={(row) => row.code}
            empty="No failed calls in this range"
            columns={[
              {
                title: 'Cause',
                render: (row) => (
                  <>
                    {errorLabel(row.code)}{' '}
                    <span className="text-muted">({row.code})</span>
                  </>
                ),
              },
              {
                title: 'Calls',
                numeric: true,
                render: (row) => formatCount(row.count),
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* Keyed: a new range starts again from the newest calls. */}
      <LatestCalls key={data.range.days} calls={data.recent} />
    </>
  );
}

/** The newest calls, whatever the range, ten to a page. */
function LatestCalls({ calls }: { calls: AiUsageReport['recent'] }) {
  const [page, setPage] = useState(1);
  // A refetch can return fewer calls than the page being shown.
  const pageCount = pageCountOf(calls.length, RECENT_PAGE_SIZE);
  if (page > pageCount) setPage(pageCount);
  const shown = calls.slice(
    (page - 1) * RECENT_PAGE_SIZE,
    page * RECENT_PAGE_SIZE,
  );
  return (
    <SectionCard
      title="Latest calls"
      description="The newest calls, whatever the range"
    >
      <DataTable
        label="Latest calls"
        rows={shown}
        rowKey={(call) => call.id}
        empty="No AI calls yet"
        contentClassName="min-w-[720px]"
        columns={[
          {
            title: 'When',
            className: 'tabular-nums whitespace-nowrap',
            render: (call) => formatDateTime(call.createdAt),
          },
          { title: 'Feature', render: (call) => featureLabel(call.feature) },
          { title: 'User', render: (call) => <UserCell user={call.user} /> },
          {
            title: 'Result',
            render: (call) =>
              call.ok ? (
                <Chip size="sm" color="success" variant="soft">
                  <Chip.Label>OK</Chip.Label>
                </Chip>
              ) : (
                <Chip size="sm" color="danger" variant="soft">
                  <CircleXmark className="size-3.5" />
                  <Chip.Label>{errorLabel(call.errorCode)}</Chip.Label>
                </Chip>
              ),
          },
          {
            title: 'Duration',
            numeric: true,
            render: (call) => seconds(call.durationMs),
          },
        ]}
        footer={
          <Pager
            page={page}
            pageSize={RECENT_PAGE_SIZE}
            total={calls.length}
            onChange={setPage}
            noun="calls"
          />
        }
      />
    </SectionCard>
  );
}
