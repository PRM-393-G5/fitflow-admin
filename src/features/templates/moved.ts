/** [ids] with the item at [index] swapped with its neighbour. */
export function moved(ids: string[], index: number, by: -1 | 1): string[] {
  const target = index + by;
  if (target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
