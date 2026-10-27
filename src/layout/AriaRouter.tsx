import { RouterProvider as AriaRouterProvider } from '@heroui/react';
import { Outlet, useHref, useNavigate } from 'react-router';

/** Lets HeroUI links and rows (`href`) navigate through the router. */
export function AriaRouter() {
  const navigate = useNavigate();
  return (
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <Outlet />
    </AriaRouterProvider>
  );
}
