import { ArrowRightFromSquare } from '@gravity-ui/icons';
import { Avatar, Button } from '@heroui/react';
import { Link, Outlet, useLocation } from 'react-router';
import { displayName } from '../auth/session';
import { useAuth } from '../auth/useAuth';
import { LOGO_URL } from '../theme/brand';
import { ThemeCycleButton, ThemeSwitch } from '../theme/ThemeSwitch';
import { activeNavPath, NAV_ITEMS } from './nav';

/**
 * A sidebar (an icon rail below `lg`) with the sections, the theme and
 * the signed-in admin; the page renders beside it.
 */
export function AdminLayout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const admin = session?.admin;
  const shownName = admin ? displayName(admin) : '';
  const active = activeNavPath(location.pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-dvh w-16 overflow-y-auto shrink-0 flex-col border-r border-separator bg-surface lg:w-64">
        <Link
          to="/"
          className="flex h-16 items-center gap-3 px-4 lg:px-5"
          aria-label="FitFlow Admin home"
        >
          <img src={LOGO_URL} alt="" className="size-8 shrink-0" />
          <span className="hidden leading-tight lg:block">
            <span className="block text-base font-semibold tracking-tight">
              FitFlow
            </span>
            <span className="block text-xs text-muted">Admin console</span>
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="flex flex-1 flex-col gap-1 p-2 lg:p-3"
        >
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = path === active;
            return (
              <Link
                key={path}
                to={path}
                title={label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-10 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors lg:justify-start ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-default hover:text-foreground'
                }`}
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="sr-only lg:not-sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t border-separator p-2 lg:p-3">
          <div className="hidden lg:block">
            <ThemeSwitch fullWidth />
          </div>
          <div className="flex justify-center lg:hidden">
            <ThemeCycleButton />
          </div>
          <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-3">
            <Avatar size="sm" color="accent" variant="soft">
              <Avatar.Fallback>
                {shownName.charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <div className="hidden min-w-0 flex-1 lg:block">
              <div className="truncate text-sm font-medium">{shownName}</div>
              {admin?.name && (
                <div className="truncate text-xs text-muted">{admin.email}</div>
              )}
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Sign out"
              onPress={logout}
            >
              <ArrowRightFromSquare />
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
