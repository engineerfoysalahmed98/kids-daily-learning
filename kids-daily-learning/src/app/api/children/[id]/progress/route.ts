import { json, requireChild, route } from "@/server/http";
import { loadProgress, toChild } from "@/server/progressRepo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const { child } = await requireChild((await params).id, { childSelfOk: true });
  return json(await loadProgress(toChild(child)));
});
