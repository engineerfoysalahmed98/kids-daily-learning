import type { ContentStore } from "../types";
import { AGE_GROUPS, BADGES, SUBJECTS } from "./meta";
import { VOCAB } from "./vocab";
import { UNITS } from "./units";
import { STORIES } from "./stories";
import { CREATIVE, HABITS } from "./activities";

export { SUBJECTS, AGE_GROUPS, BADGES, TRACK_META, AVATARS } from "./meta";
export { GRAMMAR } from "./vocab";

/**
 * The built-in curriculum. In production the admin CMS stores content in
 * PostgreSQL (see prisma/schema.prisma) and `loadContent()` in
 * src/server/content.ts merges DB rows over these defaults.
 */
export function defaultContent(): ContentStore {
  return structuredClone({
    subjects: SUBJECTS,
    ageGroups: AGE_GROUPS,
    vocab: VOCAB,
    units: UNITS,
    stories: STORIES,
    creative: CREATIVE,
    habits: HABITS,
    badges: BADGES,
  });
}
