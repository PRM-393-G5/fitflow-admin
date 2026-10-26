import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Descriptions, Typography } from 'antd';
import { ApiError } from '../api/client';
import { displayName } from '../auth/session';
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
    // The API answers 503 when it is up but its database is not.
    health.error instanceof ApiError && health.error.status === 503 ? (
      <Badge status="warning" text="API up, database unreachable" />
    ) : (
      <Badge status="error" text={health.error.message} />
    )
  ) : (
    <Badge status="success" text="API ok, database up" />
  );

  return (
    <>
      <Typography.Title level={2}>
        Welcome, {session && displayName(session.admin)}
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
