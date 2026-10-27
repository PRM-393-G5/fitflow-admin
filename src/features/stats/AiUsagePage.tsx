import { CircleXmark, Persons, Sparkles, Stopwatch } from '@gravity-ui/icons';
import { Card, Chip, Link, Table } from '@heroui/react';
import { useState, type ReactNode } from 'react';
import { DailyBarChart } from '../../charts/DailyBarChart';
import { DailyTable } from '../../charts/DailyTable';
import { HorizontalBarChart } from '../../charts/HorizontalBarChart';
import { formatCount, formatDay, useChartTokens } from '../../charts/tokens';
import { formatDateTime } from '../../format';
import { ChartCard } from '../../ui/ChartCard';
import { Dimmed, EmptyRows, Notice, ReportSkeleton } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { Pager } from '../../ui/Pager';
import { StatTile } from '../../ui/StatTile';
import { userPath } from '../users/paths';
import { useAiUsage } from './api';
import { errorLabel, FEATURE_LABELS } from './labels';
import { RangeFilter } from './RangeFilter';
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

/** A titled card around one table. */
function TableCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-base font-semibold">{title}</Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <RangeFilter days={days} onChange={setDays} />
        {data && (
          <span className="text-sm text-muted">
            {formatDay(data.range.from)} – {formatDay(data.range.to)} ·{' '}
            {data.range.tz}
          </span>
        )}
      </div>

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
  const [page, setPage] = useState(1);
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
  const recent = data.recent.slice(
    (page - 1) * RECENT_PAGE_SIZE,
    page * RECENT_PAGE_SIZE,
  );

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
              <Table variant="secondary">
                <Table.ScrollContainer>
                  <Table.Content aria-label="Calls by feature">
                    <Table.Header>
                      <Table.Column isRowHeader>Feature</Table.Column>
                      <Table.Column className="text-end">Calls</Table.Column>
                      <Table.Column className="text-end">Failed</Table.Column>
                      <Table.Column className="text-end">Avg</Table.Column>
                    </Table.Header>
                    <Table.Body
                      renderEmptyState={() => (
                        <EmptyRows>No AI calls in this range.</EmptyRows>
                      )}
                    >
                      {data.byFeature.map((row) => (
                        <Table.Row key={row.feature} id={row.feature}>
                          <Table.Cell>{featureLabel(row.feature)}</Table.Cell>
                          <Table.Cell className="tabular text-end">
                            {formatCount(row.calls)}
                          </Table.Cell>
                          <Table.Cell className="tabular text-end">
                            {formatCount(row.errors)}
                          </Table.Cell>
                          <Table.Cell className="tabular text-end">
                            {seconds(row.avgDurationMs)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TableCard title="Top users" description="Most calls in this range">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Top users">
                <Table.Header>
                  <Table.Column isRowHeader>User</Table.Column>
                  <Table.Column className="text-end">Calls</Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <EmptyRows>No signed-in calls in this range</EmptyRows>
                  )}
                >
                  {data.topUsers.map((row) => (
                    <Table.Row key={row.id} id={row.id}>
                      <Table.Cell>
                        <UserCell user={row} />
                      </Table.Cell>
                      <Table.Cell className="tabular text-end">
                        {formatCount(row.calls)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </TableCard>
        <TableCard title="Failures by cause" description="Why calls failed">
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Failures by cause">
                <Table.Header>
                  <Table.Column isRowHeader>Cause</Table.Column>
                  <Table.Column className="text-end">Calls</Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <EmptyRows>No failed calls in this range</EmptyRows>
                  )}
                >
                  {data.errorsByCode.map((row) => (
                    <Table.Row key={row.code} id={row.code}>
                      <Table.Cell>
                        {errorLabel(row.code)}{' '}
                        <span className="text-muted">({row.code})</span>
                      </Table.Cell>
                      <Table.Cell className="tabular text-end">
                        {formatCount(row.count)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </TableCard>
      </div>

      <TableCard
        title="Latest calls"
        description="The newest calls, whatever the range"
      >
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Latest calls" className="min-w-[720px]">
              <Table.Header>
                <Table.Column isRowHeader>When</Table.Column>
                <Table.Column>Feature</Table.Column>
                <Table.Column>User</Table.Column>
                <Table.Column>Result</Table.Column>
                <Table.Column className="text-end">Duration</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => <EmptyRows>No AI calls yet</EmptyRows>}
              >
                {recent.map((call) => (
                  <Table.Row key={call.id} id={call.id}>
                    <Table.Cell className="tabular whitespace-nowrap">
                      {formatDateTime(call.createdAt)}
                    </Table.Cell>
                    <Table.Cell>{featureLabel(call.feature)}</Table.Cell>
                    <Table.Cell>
                      <UserCell user={call.user} />
                    </Table.Cell>
                    <Table.Cell>
                      {call.ok ? (
                        <Chip size="sm" color="success" variant="soft">
                          <Chip.Label>OK</Chip.Label>
                        </Chip>
                      ) : (
                        <Chip size="sm" color="danger" variant="soft">
                          <CircleXmark className="size-3.5" />
                          <Chip.Label>{errorLabel(call.errorCode)}</Chip.Label>
                        </Chip>
                      )}
                    </Table.Cell>
                    <Table.Cell className="tabular text-end">
                      {seconds(call.durationMs)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          {data.recent.length > RECENT_PAGE_SIZE && (
            <Table.Footer>
              <Pager
                page={page}
                pageSize={RECENT_PAGE_SIZE}
                total={data.recent.length}
                onChange={setPage}
                noun="calls"
              />
            </Table.Footer>
          )}
        </Table>
      </TableCard>
    </>
  );
}
