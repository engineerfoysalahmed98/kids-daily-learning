import { getSession, json, route } from "@/server/http";
import { parentDto } from "@/server/auth";

export const GET = route(async () => {
  const s = await getSession();
  if (!s) return json({ parent: null, activeChildId: null, mode: null });
  return json({ parent: await parentDto(s.pid), activeChildId: s.cid, mode: s.mode });
});
