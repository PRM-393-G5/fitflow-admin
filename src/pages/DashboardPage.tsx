import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Descriptions, Typography } from 'antd';
import { useApi, useAuth } from '../auth/useAuth';

interface Health {
  status: string;
  database: string;
}

export function DashboardPage() {
  const { session } = useAuth();
  const api = useApi();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<Health>('health'),
    retry: false,
  });

  const apiStatus = health.isPending ? (
    <Badge status="processing" text="Checking…" />
  ) : health.isError ? (
    <Badge status="error" text={health.error.message} />
  ) : (
    <Badge
      status={health.data.database === 'up' ? 'success' : 'warning'}
      text={`API ${health.data.status}, database ${health.data.database}`}
    />
  );

  return (
    <>
      <Typography.Title level={2}>
        Welcome, {session?.admin.name || session?.admin.email}
      </Typography.Title>
      <Card title="System">
        <Descriptions column={1}>
          <Descriptions.Item label="FitFlow API">{apiStatus}</Descriptions.Item>
          <Descriptions.Item label="Signed in as">
            {session?.admin.email}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}
