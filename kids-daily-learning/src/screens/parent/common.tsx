"use client";
import { useEffect, useMemo, useState } from "react";
import type { Child, ChildProgress, ContentStore } from "@/core/types";
import { useApp, useLoad } from "@/state/AppProvider";

export interface Family {
  children: Child[];
  progress: Record<string, ChildProgress>;
  content: ContentStore;
}

/** Loads every child with progress for the parent screens. */
export function useFamily() {
  const { session } = useApp();
  return useLoad<Family>(async (s) => {
    const [children, content] = await Promise.all([s.listChildren(), s.getContent()]);
    const all = await Promise.all(children.map((c) => s.getProgress(c.id)));
    return { children, content, progress: Object.fromEntries(all.map((p) => [p.child.id, p])) };
  }, [], `family:${session?.parent?.id ?? "none"}`);
}

let remembered: string | null = null;

/** Selected child shared across parent pages during the session. */
export function useSelectedChild(children: Child[] | undefined) {
  const [id, setId] = useState<string | null>(remembered);
  useEffect(() => {
    if (!children?.length) return;
    if (!id || !children.some((c) => c.id === id)) setId(children[0].id);
  }, [children, id]);
  const select = (x: string) => { remembered = x; setId(x); };
  const child = useMemo(() => children?.find((c) => c.id === id) ?? children?.[0], [children, id]);
  return { child, select };
}

export function ChildSwitcher({ profiles, selected, onSelect }: { profiles: Child[]; selected?: string; onSelect: (id: string) => void }) {
  if (profiles.length < 2) return null;
  return (
    <div role="tablist" aria-label="Choose a child" className="flex flex-wrap gap-2">
      {profiles.map((c) => (
        <button key={c.id} role="tab" aria-selected={selected === c.id} onClick={() => onSelect(c.id)}
          className={`flex min-h-[48px] items-center gap-2 rounded-2xl border-2 px-4 font-bold ${selected === c.id ? "border-ink bg-surface" : "border-transparent bg-sunken text-muted hover:text-ink"}`}>
          <span className="text-2xl" aria-hidden="true">{c.avatar}</span>{c.name}
        </button>
      ))}
    </div>
  );
}

export function fmtDay(day: string, opts: Intl.DateTimeFormatOptions = { weekday: "short" }) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export function fmtMinutes(sec: number) {
  const m = Math.round(sec / 60);
  return m < 1 ? "<1 min" : `${m} min`;
}
