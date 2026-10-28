export const userPath = (id: string) => `/users/${encodeURIComponent(id)}`;

/** Router state carrying the list's filters to a user's page and back. */
export interface FromList {
  listSearch: string;
}

/** The list a user's page returns to: the one it was opened from. */
export function usersListPath(state: unknown): string {
  const search = (state as Partial<FromList> | null)?.listSearch;
  return `/users${typeof search === 'string' ? search : ''}`;
}
