import { Navigate, type RouteObject } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AdminLayout } from './layout/AdminLayout';
import { AriaRouter } from './layout/AriaRouter';
import { LoginPage } from './pages/LoginPage';
import { PageLoading } from './ui/feedback';

const templateEditor = () =>
  import('./features/templates/TemplateEditorPage').then((module) => ({
    Component: module.TemplateEditorPage,
  }));

const pages: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        lazy: () =>
          import('./pages/DashboardPage').then((module) => ({
            Component: module.DashboardPage,
          })),
      },
      {
        path: 'ai',
        lazy: () =>
          import('./features/stats/AiUsagePage').then((module) => ({
            Component: module.AiUsagePage,
          })),
      },
      {
        path: 'users',
        lazy: () =>
          import('./features/users/UsersPage').then((module) => ({
            Component: module.UsersPage,
          })),
      },
      {
        path: 'users/:id',
        lazy: () =>
          import('./features/users/UserDetailPage').then((module) => ({
            Component: module.UserDetailPage,
          })),
      },
      {
        path: 'templates',
        lazy: () =>
          import('./features/templates/TemplatesPage').then((module) => ({
            Component: module.TemplatesPage,
          })),
      },
      {
        path: 'templates/new',
        lazy: templateEditor,
      },
      {
        // `/edit` keeps a template whose id is `new` reachable.
        path: 'templates/:id/edit',
        lazy: templateEditor,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export const routes: RouteObject[] = [
  // The first visit waits for a lazy page's code: show a spinner.
  { element: <AriaRouter />, HydrateFallback: PageLoading, children: pages },
];
