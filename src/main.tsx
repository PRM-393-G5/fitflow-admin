import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './index.css';
import './legacy.css';
import { Providers } from './providers';
import { createQueryClient } from './queryClient';
import { routes } from './routes';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers queryClient={createQueryClient()}>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
