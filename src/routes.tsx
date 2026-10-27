import { Navigate, type RouteObject } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AdminLayout } from './layout/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

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
        lazy: () =>
          import('./features/templates/TemplateEditorPage').then((module) => ({
            Component: module.TemplateEditorPage,
          })),
      },
      {
        path: 'templates/:id',
        lazy: () =>
          import('./features/templates/TemplateEditorPage').then((module) => ({
            Component: module.TemplateEditorPage,
          })),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
