import type { NextRequest } from "next/server";
import { body, HttpError, json, requireChild, route } from "@/server/http";
import { CompletionSchema } from "@/server/schemas";
import { db } from "@/server/db";
import { loadContent } from "@/server/content";
import { loadProgress, recordCompletion, toChild } from "@/server/progressRepo";
import { dayKey, resolveActivity, type CompletionInput } from "@/core/engine";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Submit a finished activity. The server rebuilds the activity from its id
 * and scores the raw responses itself — the client never sends a score or XP.
 */
export const POST = route<Ctx>(async (req: NextRequest, { params }) => {
  const { child: row, session } = await requireChild((await params).id, { childSelfOk: true });
  const { activityId, input } = await body(req, CompletionSchema);
  const child = toChild(row);
  const [content, progress, settings] = await Promise.all([
    loadContent(), loadProgress(child), db.parentSettings.findUnique({ where: { parentId: session.pid } }),
  ]);
  const activity = resolveActivity({ child, history: progress.completions, content, timeZone: settings?.timeZone }, activityId);
  if (!activity) throw new HttpError(404, "We couldn't find that activity.");
  try {
    const result = await recordCompletion({
      progress, activity, input: input as CompletionInput, content, today: dayKey(new Date(), settings?.timeZone ?? "UTC"),
      notify: { activity: settings?.notifyActivity ?? true, badge: settings?.notifyBadge ?? true, goal: settings?.notifyGoal ?? true },
    });
    return json(result, 201);
  } catch (e) {
    if (e instanceof Error && /needs quiz answers|completed with/.test(e.message)) throw new HttpError(400, e.message);
    throw e;
  }
});
