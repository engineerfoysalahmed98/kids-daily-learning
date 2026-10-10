"use client";
import { useState } from "react";
import type { Activity, Completion } from "@/core/types";
import type { CompletionInput } from "@/core/engine";
import { TRACK_META } from "@/core/content/meta";
import { useApp } from "@/state/AppProvider";
import { activityHref } from "@/state/useChild";
import { useNav, Link } from "@/nav/nav";
import { Blob } from "@/ui/primitives";
import { BORDER, toneOf } from "@/ui/colors";

const DIFFICULTY = ["", "Easy", "Easy", "Medium", "Tricky", "Challenge"];

export function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulty: ${DIFFICULTY[level]}`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 w-2 rounded-full ${i <= level ? "bg-ink/70" : "bg-line"}`} aria-hidden="true" />)}
      <span className="ml-1 text-xs font-extrabold text-muted" aria-hidden="true">{DIFFICULTY[level]}</span>
    </span>
  );
}

export function ActivityCard({ activity, done, index }: { activity: Activity; done?: Completion; index?: number }) {
  const meta = TRACK_META[activity.track];
  const tone = toneOf(meta.color);
  return (
    <article className={`card relative flex flex-col gap-3 p-4 ${done ? "border-good/50" : BORDER[tone]} animate-rise`} style={index !== undefined ? { animationDelay: `${index * 40}ms` } : undefined}>
      <div className="flex items-start gap-3">
        <Blob tone={tone} emoji={activity.icon} />
        <div className="min-w-0 flex-1">
          <p className="label">{meta.icon} {meta.label}</p>
          <h3 className="text-xl leading-tight">{activity.title}</h3>
        </div>
        {done && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-good text-lg text-white" aria-label="Completed">✓</span>}
      </div>
      <p className="text-muted">{activity.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <DifficultyDots level={activity.difficulty} />
          <span className="font-extrabold text-muted">⏱ {activity.minutes} min</span>
        </div>
        {done ? (
          <Link to={activityHref(activity)} className="btn-secondary btn-sm" aria-label={`Play ${activity.title} again`}>
            {done.scorePct !== null ? `${"⭐".repeat(done.stars)} Again` : "⭐⭐⭐ Again"}
          </Link>
        ) : (
          <Link to={activityHref(activity)} className="btn-primary btn-sm" aria-label={`Start ${activity.title}`}>Start ▶</Link>
        )}
      </div>
    </article>
  );
}

/** Submit a finished activity and go to the completion screen. */
export function useSubmitCompletion(childId: string | null, activityId: string | undefined) {
  const { service, results } = useApp();
  const nav = useNav();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(input: CompletionInput) {
    if (!childId || !activityId) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await service.submitCompletion(childId, activityId, input);
      results.set(activityId, r);
      nav.go(`/complete/${encodeURIComponent(activityId)}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }
  return { submit, submitting, error };
}

export function BackButton({ fallback = "/home", label = "Back" }: { fallback?: string; label?: string }) {
  const nav = useNav();
  return (
    <button type="button" onClick={() => nav.back(fallback)} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl pr-3 font-bold text-muted hover:text-ink">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sunken" aria-hidden="true">←</span>{label}
    </button>
  );
}

export function NotFound({ what = "activity" }: { what?: string }) {
  return (
    <div className="card mx-auto mt-8 grid max-w-md place-items-center gap-3 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">🧭</span>
      <h1 className="text-2xl">We couldn&apos;t find that {what}</h1>
      <p className="text-muted">It may have changed. Let&apos;s pick something from today&apos;s adventure.</p>
      <Link to="/home" className="btn-primary">Go home</Link>
    </div>
  );
}
