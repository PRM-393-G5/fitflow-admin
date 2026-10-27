import { CloseCircleFilled } from '@ant-design/icons';
import { Alert, Card, Col, Row, Skeleton, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import { ChartCard } from '../../charts/ChartCard';
import { DailyBarChart } from '../../charts/DailyBarChart';
import { HorizontalBarChart } from '../../charts/HorizontalBarChart';
import { StatTile } from '../../charts/StatTile';
import { CHART, formatCount, formatDay } from '../../charts/tokens';
import { formatDateTime } from '../../format';
import { DailyTable } from '../../charts/DailyTable';
import { userPath } from '../users/paths';
import { useAiUsage } from './api';
import { errorLabel, FEATURE_LABELS } from './labels';
import { RangeFilter } from './RangeFilter';
import { useRangeDays } from './range';
import type { AiFeature, AiUsageReport, AiUsageUser } from './types';

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

function UserCell({ user }: { user: AiUsageUser | null }) {
  if (!user || user.email === null) {
    return <Typography.Text type="secondary">Deleted account</Typography.Text>;
  }
  return <Link to={userPath(user.id)}>{user.name || user.email}</Link>;
}

export function AiUsagePage() {
  const [days, setDays] = useRangeDays();
  const report = useAiUsage(days);
  const data = report.data;

  return (
    <>
      <div className="page-header">
        <div>
          <Typography.Title level={2}>AI usage</Typography.Title>
          <Typography.Text type="secondary">
            Calls to the AI features, by feature, day and user. Prompts, photos
            and answers are never stored.
          </Typography.Text>
        </div>
      </div>

      <div className="filter-row">
        <RangeFilter days={days} onChange={setDays} />
      </div>

      {report.isError && (
        <Alert
          type="error"
          showIcon
          title={report.error.message}
          style={{ marginBottom: 16 }}
        />
      )}
      {data && !data.status.configured && (
        <Alert
          type="warning"
          showIcon
          title="OPENAI_API_KEY is not set on the API: every AI feature answers “not configured”."
          style={{ marginBottom: 16 }}
        />
      )}

      {!data ? (
        report.isPending && <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div
          style={{
            opacity: report.isPlaceholderData ? 0.55 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <AiUsageContent data={data} />
        </div>
      )}
    </>
  );
}

function AiUsageContent({ data }: { data: AiUsageReport }) {
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
    label: FEATURE_LABELS[row.feature] ?? row.feature,
    value: row.calls,
  }));

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} xl={6}>
          <StatTile
            label="Calls"
            value={formatCount(totals.calls)}
            note={`${formatDay(data.range.from)} – ${formatDay(data.range.to)}`}
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatTile
            label="Failed"
            value={formatCount(totals.errors)}
            note={`${failedShare}% of calls`}
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatTile
            label="Users"
            value={formatCount(totals.users)}
            note={
              totals.anonymousCalls > 0
                ? `+ ${formatCount(totals.anonymousCalls)} calls from deleted accounts`
                : 'Signed-in users who used AI'
            }
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatTile
            label="Average duration"
            value={seconds(totals.avgDurationMs)}
            note={`Model ${data.status.model}`}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={14}>
          <ChartCard
            title="Calls per day"
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
                rows={daily}
                columns={[
                  ['succeeded', 'Succeeded'],
                  ['failed', 'Failed'],
                ]}
              />
            }
          />
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard
            title="Calls by feature"
            chart={
              byFeature.length > 0 ? (
                <HorizontalBarChart data={byFeature} valueLabel="Calls" />
              ) : (
                <Typography.Text type="secondary">
                  No AI calls in this range.
                </Typography.Text>
              )
            }
            table={
              <Table
                size="small"
                rowKey="feature"
                pagination={false}
                dataSource={data.byFeature}
                columns={[
                  {
                    title: 'Feature',
                    dataIndex: 'feature',
                    render: (feature: AiFeature) =>
                      FEATURE_LABELS[feature] ?? feature,
                  },
                  {
                    title: 'Calls',
                    dataIndex: 'calls',
                    align: 'right',
                    className: 'tabular',
                    render: formatCount,
                  },
                  {
                    title: 'Failed',
                    dataIndex: 'errors',
                    align: 'right',
                    className: 'tabular',
                    render: formatCount,
                  },
                  {
                    title: 'Avg',
                    dataIndex: 'avgDurationMs',
                    align: 'right',
                    className: 'tabular',
                    render: seconds,
                  },
                ]}
              />
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={12}>
          <Card title="Top users">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={data.topUsers}
              locale={{ emptyText: 'No signed-in calls in this range' }}
              columns={[
                {
                  title: 'User',
                  key: 'user',
                  render: (_, row) => <UserCell user={row} />,
                },
                {
                  title: 'Calls',
                  dataIndex: 'calls',
                  align: 'right',
                  className: 'tabular',
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Failures by cause">
            <Table
              size="small"
              rowKey="code"
              pagination={false}
              dataSource={data.errorsByCode}
              locale={{ emptyText: 'No failed calls in this range' }}
              columns={[
                {
                  title: 'Cause',
                  dataIndex: 'code',
                  render: (code: string) => (
                    <>
                      {errorLabel(code)}{' '}
                      <Typography.Text type="secondary">
                        ({code})
                      </Typography.Text>
                    </>
                  ),
                },
                {
                  title: 'Calls',
                  dataIndex: 'count',
                  align: 'right',
                  className: 'tabular',
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Latest calls (any date)">
        <Table
          size="small"
          rowKey="id"
          dataSource={data.recent}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{ emptyText: 'No AI calls yet' }}
          scroll={{ x: 720 }}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              render: (at: string) => formatDateTime(at),
            },
            {
              title: 'Feature',
              dataIndex: 'feature',
              render: (feature: AiFeature) =>
                FEATURE_LABELS[feature] ?? feature,
            },
            {
              title: 'User',
              key: 'user',
              render: (_, call) => <UserCell user={call.user} />,
            },
            {
              title: 'Result',
              key: 'result',
              render: (_, call) =>
                call.ok ? (
                  <Tag color="green">OK</Tag>
                ) : (
                  <Tag icon={<CloseCircleFilled />} color="red">
                    {errorLabel(call.errorCode)}
                  </Tag>
                ),
            },
            {
              title: 'Duration',
              dataIndex: 'durationMs',
              align: 'right',
              className: 'tabular',
              render: seconds,
            },
          ]}
        />
      </Card>
    </>
  );
}
