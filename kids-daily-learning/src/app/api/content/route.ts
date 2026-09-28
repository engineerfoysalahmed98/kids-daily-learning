import { json, requireSession, route } from "@/server/http";
import { loadContent } from "@/server/content";

export const GET = route(async () => {
  await requireSession();
  return json(await loadContent());
});
