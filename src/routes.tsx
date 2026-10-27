import { Navigate, type RouteObject } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AdminLayout } from './layout/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const templateEditor = () =>
  import('./features/templates/TemplateEditorPage').then((module) => ({
    Component: module.TemplateEditorPage,
  }));

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
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
