import {
  House,
  LayoutHeaderCellsLarge,
  Persons,
  Sparkles,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** The sidebar; each feature adds its page here. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: House },
  { path: '/users', label: 'Users', icon: Persons },
  { path: '/templates', label: 'Templates', icon: LayoutHeaderCellsLarge },
  { path: '/ai', label: 'AI usage', icon: Sparkles },
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
