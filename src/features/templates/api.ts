import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../auth/useAuth';
import type { Template, TemplateInput } from './types';

const LIST_KEY = ['templates'] as const;
const itemKey = (id: string) => ['templates', id] as const;

export function useTemplates() {
  const api = useApi();
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => api.get<Template[]>('admin/templates'),
  });
}

export function useTemplate(id: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: itemKey(id ?? ''),
    queryFn: () =>
      api.get<Template>(`admin/templates/${encodeURIComponent(id!)}`),
    enabled: id !== undefined,
  });
}

/** Creates the template, or replaces [existingId]'s fields. */
export function useSaveTemplate(existingId: string | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: TemplateInput) => {
      if (existingId === undefined) {
        return api.post<Template>('admin/templates', template);
      }
      const { id, ...fields } = template;
      void id;
      return api.put<Template>(
        `admin/templates/${encodeURIComponent(existingId)}`,
        fields,
      );
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(itemKey(saved.id), saved);
      return queryClient.invalidateQueries({ queryKey: LIST_KEY, exact: true });
    },
  });
}

export function useDeleteTemplate() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`admin/templates/${encodeURIComponent(id)}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: itemKey(id) });
      return queryClient.invalidateQueries({ queryKey: LIST_KEY, exact: true });
    },
  });
}

/** Saves a new display order; the list updates right away. */
export function useReorderTemplates() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post<Template[]>('admin/templates/reorder', { ids }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY, exact: true });
      const previous = queryClient.getQueryData<Template[]>(LIST_KEY);
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]));
        queryClient.setQueryData(
          LIST_KEY,
          ids.flatMap((id) => byId.get(id) ?? []),
        );
      }
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LIST_KEY, context.previous);
      }
    },
    onSuccess: (list) => queryClient.setQueryData(LIST_KEY, list),
  });
}
