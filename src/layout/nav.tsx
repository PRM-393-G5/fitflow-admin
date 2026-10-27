import { DashboardOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

/** The sidebar; each feature adds its page here. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
];

/** The nav item whose section contains [pathname] (`/users/1` → `/users`). */
export function activeNavPath(pathname: string): string {
  const match = NAV_ITEMS.filter(
    (item) =>
      pathname === item.path ||
      (item.path !== '/' && pathname.startsWith(`${item.path}/`)),
  ).sort((a, b) => b.path.length - a.path.length)[0];
  return match?.path ?? '/';
}
