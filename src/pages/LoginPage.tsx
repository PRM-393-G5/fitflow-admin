import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useLocation, type Location } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { loginErrorMessage } from './loginErrorMessage';

interface Credentials {
  email: string;
  password: string;
}

export function LoginPage() {
  const { session, login } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fromLocation = (location.state as { from?: Location } | null)?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search}${fromLocation.hash}`
    : '/';

  if (session) return <Navigate to={from} replace />;

  const onFinish = async ({ email, password }: Credentials) => {
    setSubmitting(true);
    setError(null);
    try {
      // Signed in: this page re-renders into <Navigate to={from} />.
      await login(email, password);
    } catch (caught) {
      setError(loginErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" width={40} height={40} />
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              FitFlow Admin
            </Typography.Title>
            <Typography.Text type="secondary">
              Sign in with your admin account
            </Typography.Text>
          </div>
        </div>
        {error && (
          <Alert
            type="error"
            title={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form<Credentials>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          disabled={submitting}
        >
          <Form.Item
            label="Email"
            name="email"
            normalize={(value: string) => value.trim()}
            rules={[
              { required: true, message: 'Enter your email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              autoComplete="username"
              autoFocus
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
