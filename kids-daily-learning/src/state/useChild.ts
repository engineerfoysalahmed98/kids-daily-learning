"use client";
import { useMemo } from "react";
import type { Activity, ChildProgress, ChildSummary, ContentStore } from "@/core/types";
import { buildDailyPlan, dayKey, resolveActivity, summarize } from "@/core/engine";
import { useApp, useLoad } from "./AppProvider";

export interface ChildData {
  childId: string | null;
  progress: ChildProgress | undefined;
  content: ContentStore | undefined;
  plan: Activity[];
  summary: ChildSummary | undefined;
  today: string;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/** Everything a child screen needs: progress, content, today's plan, totals. */
export function useChildData(): ChildData {
  const { session } = useApp();
  const childId = session?.activeChildId ?? null;
  const progress = useLoad((s) => (childId ? s.getProgress(childId) : Promise.resolve(undefined)), [childId], childId ? `progress:${childId}` : undefined);
  const content = useLoad((s) => s.getContent(), [], "content");
  const today = dayKey();
  const p = progress.data;
  const c = content.data;
  const plan = useMemo(() => (p && c ? buildDailyPlan({ child: p.child, history: p.completions, content: c }, today) : []), [p, c, today]);
  const summary = useMemo(() => (p ? summarize(p, today) : undefined), [p, today]);
  return {
    childId, progress: p, content: c, plan, summary, today,
    loading: !p || !c ? progress.loading || content.loading : false,
    error: progress.error ?? content.error,
    reload: () => { progress.reload(); content.reload(); },
  };
}

export function useActivity(id: string | undefined) {
  const data = useChildData();
  const activity = useMemo(() => {
    if (!id || !data.progress || !data.content) return undefined;
    return resolveActivity({ child: data.progress.child, history: data.progress.completions, content: data.content }, id) ?? null;
  }, [id, data.progress, data.content]);
  return { ...data, activity };
}

/** Where tapping "Start" takes the child for each kind of activity. */
export function activityHref(a: Pick<Activity, "id" | "kind">): string {
  const id = encodeURIComponent(a.id);
  switch (a.kind) {
    case "lesson-quiz": return `/lesson/${id}`;
    case "quiz": return `/quiz/${id}`;
    case "story": return `/read/${id}`;
    case "creative": return `/create/${id}`;
    case "habit": return `/habit/${id}`;
    case "game": return `/memory/${id}`;
  }
}
