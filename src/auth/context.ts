import { createContext } from 'react';
import type { ApiClient } from '../api/client';
import type { Session } from './session';

export interface AuthValue {
  session: Session | null;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthValue | null>(null);
