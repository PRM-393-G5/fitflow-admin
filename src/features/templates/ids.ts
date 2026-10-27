/** What the API accepts as a template id (see fitflow-api's README). */
export const TEMPLATE_ID_PATTERN =
  /^(?!custom-)(?!form-check$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_TEMPLATE_ID_LENGTH = 64;

/**
 * Lowercase words joined by `-`, accents removed: "Đẩy ngực nâng cao" →
 * "day-nguc-nang-cao". Empty when nothing usable is left.
 */
export function slugify(text: string, maxLength = 64): string {
  return text
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
}

/** A template id derived from [name] that the API will accept. */
export function templateIdFor(name: string): string {
  const slug = slugify(name, MAX_TEMPLATE_ID_LENGTH);
  if (!slug) return '';
  if (TEMPLATE_ID_PATTERN.test(slug)) return slug;
  return slugify(`plan-${slug}`, MAX_TEMPLATE_ID_LENGTH);
}

/**
 * Ids for [exercises]: existing ids are kept (the app keys progress and
 * history by them), new ones come from the name and never repeat.
 */
export function assignExerciseIds(
  exercises: Array<{ id?: string; name: string }>,
): string[] {
  const taken = new Set(
    exercises.flatMap((exercise) => (exercise.id ? [exercise.id] : [])),
  );
  return exercises.map((exercise) => {
    if (exercise.id) return exercise.id;
    const base = slugify(exercise.name, 56) || 'exercise';
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return id;
  });
}
