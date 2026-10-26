/** Base URL of the FitFlow API, ending in `/api` (no trailing slash). */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
).replace(/\/+$/, '');
