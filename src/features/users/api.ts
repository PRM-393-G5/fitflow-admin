import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useApi } from '../../auth/useAuth';
import type { UserDetail, UserPage, UserQuery, UserSummary } from './types';

const ALL = ['users'] as const;
const pageKey = (query: UserQuery) => ['users', 'list', query] as const;
const detailKey = (id: string) => ['users', 'detail', id] as const;

/** `?search=&status=&page=&limit=` for the list route. */
export function userListPath(query: UserQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  const search = query.search.trim();
  if (search) params.set('search', search);
  if (query.status !== 'all') params.set('status', query.status);
  return `admin/users?${params}`;
}

export function useUsers(query: UserQuery) {
  const api = useApi();
  return useQuery({
    queryKey: pageKey(query),
    queryFn: () => api.get<UserPage>(userListPath(query)),
    // Keep the table filled while the next page or search loads.
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => api.get<UserDetail>(`admin/users/${encodeURIComponent(id)}`),
  });
}

/** Locks (`true`) or unlocks the account; either way its sessions end. */
export function useSetUserLocked(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (disabled: boolean) =>
      api.patch<UserSummary>(`admin/users/${encodeURIComponent(id)}`, {
        disabled,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALL }),
  });
}

export function useDeleteUser(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`admin/users/${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: detailKey(id) });
      return queryClient.invalidateQueries({ queryKey: ALL });
    },
  });
}
