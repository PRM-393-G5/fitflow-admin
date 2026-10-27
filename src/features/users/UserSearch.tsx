import { SearchField } from '@heroui/react';
import { useEffect, useState } from 'react';

const SEARCH_DELAY_MS = 300;

/**
 * The list's search box: searches once the admin pauses typing, and
 * follows the URL when Back or a link changes the search. Its own
 * component, so a keystroke re-renders the box, not the whole table.
 */
export function UserSearch({
  value,
  onSearch,
}: {
  /** The search in the URL. */
  value: string;
  onSearch: (search: string) => void;
}) {
  const [search, setSearch] = useState(value);
  // Back, or the sidebar link, can change the URL's search: follow it
  // (adjusting state during render, as React recommends).
  const [searchFrom, setSearchFrom] = useState(value);
  // The search our debounce last wrote: its URL update can land after the
  // admin typed more, and must not wipe those keystrokes.
  const [written, setWritten] = useState<string | null>(null);
  if (value !== searchFrom) {
    setSearchFrom(value);
    if (value === written) {
      // Our write has landed; from now on this value is like any other.
      setWritten(null);
    } else if (search.trim() !== value) {
      setSearch(value);
    }
  }

  // Search as the admin types, once they pause.
  useEffect(() => {
    if (search.trim() === value) return;
    const timer = setTimeout(() => {
      setWritten(search.trim());
      onSearch(search.trim());
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, value, onSearch]);

  return (
    <SearchField
      aria-label="Search users"
      value={search}
      onChange={setSearch}
      maxLength={100}
      className="w-full sm:w-72"
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder="Search email or name" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
