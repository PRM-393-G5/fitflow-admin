import { LogoutOutlined } from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, Space, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router';
import { displayName } from '../auth/session';
import { useAuth } from '../auth/useAuth';
import { BRAND_COLOR, LOGO_URL } from '../theme';
import { activeNavPath, NAV_ITEMS } from './nav';

export function AdminLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const admin = session?.admin;
  const shownName = admin ? displayName(admin) : '';

  return (
    <Layout className="admin-layout">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        theme="light"
        width={220}
      >
        <Link to="/" className="sider-brand">
          <img src={LOGO_URL} alt="" width={28} height={28} />
          <span>FitFlow Admin</span>
        </Link>
        <Menu
          mode="inline"
          selectedKeys={[activeNavPath(location.pathname)]}
          items={NAV_ITEMS.map((item) => ({
            key: item.path,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>,
          }))}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="admin-header">
          <Space size="middle">
            <Avatar style={{ backgroundColor: BRAND_COLOR }}>
              {shownName.charAt(0).toUpperCase()}
            </Avatar>
            <div className="admin-identity">
              <Typography.Text strong>{shownName}</Typography.Text>
              {admin?.name && (
                <Typography.Text type="secondary">
                  {admin.email}
                </Typography.Text>
              )}
            </div>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Sign out
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content className="admin-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
