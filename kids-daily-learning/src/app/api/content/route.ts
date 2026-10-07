import { json, route } from "@/server/http";
import { loadContent } from "@/server/content";

/**
 * Public, read-only curriculum (lessons, stories, games, badges). Contains no
 * personal data, so guests can learn without an account. Editing stays
 * admin-only via /api/admin/content/[type].
 */
export const GET = route(async () => json(await loadContent()));
