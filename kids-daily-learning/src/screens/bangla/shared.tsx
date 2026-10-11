"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AGE_PATHS, agePath, LEVEL_NAME, setAgeGroup, toBn, type BnAgeGroup, type BnBadge, type BnLevel } from "@/core/bangla";
import { Link, useNav } from "@/nav/nav";
import { updateBnProgress, useBnProgress } from "@/state/bnGuestStore";
import { Logo } from "@/ui/brand";
import { Modal } from "@/ui/primitives";

export const HUB = "/bangla-math";

/**
 * Frame for every Bangla math page: Bangla by default (lang="bn"), no login,
 * stars and the chosen age group always visible and changeable.
 */
export function BanglaShell({ children, back }: { children: ReactNode; back?: { to: string; label: string } }) {
  const { progress, loaded } = useBnProgress();
  const [pickAge, setPickAge] = useState(false);
  const path = agePath(progress.ageGroup);
  return (
    <div lang="bn" className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">মূল অংশে যাও</a>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
          <Link to="/" aria-label="Kids Daily Learning — হোম" className="shrink-0"><Logo compact /></Link>
          <Link to={HUB} className="hidden min-h-[44px] items-center rounded-xl px-2 font-display text-lg font-semibold sm:inline-flex">বাংলা গণিত</Link>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPickAge(true)} className="chip min-h-[44px] bg-math/15 px-3" aria-label="বয়সের দল বদলাও">
              <span aria-hidden="true">{path?.emoji ?? "🎂"}</span>{loaded ? (path?.label ?? "বয়স বাছো") : "…"}
            </button>
            <Link to={`${HUB}/progress`} className="chip min-h-[44px] bg-sun/30 px-3" aria-label={`আমার অগ্রগতি — মোট ${toBn(progress.stars)}টি তারা`}>
              ⭐ <span className="tnum">{loaded ? toBn(progress.stars) : "…"}</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 pt-5">
        {back && <BackLink to={back.to} label={back.label} />}
        {children}
        <LocalSaveNote />
      </main>
      <AgePickerModal open={pickAge} onClose={() => setPickAge(false)} />
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="btn-ghost btn-sm w-fit -ml-2">← {label}</Link>;
}

/** Explains honestly where guest progress lives. */
export function LocalSaveNote() {
  const { storageOk } = useBnProgress();
  return (
    <p className="rounded-2xl bg-sunken px-4 py-3 text-sm font-semibold text-muted">
      🔒 লগইন বা ইমেইল লাগে না। তোমার তারা আর অগ্রগতি শুধু এই ডিভাইসে রাখা হয়।
      ব্রাউজারের ডেটা মুছে ফেললে বা অন্য ডিভাইসে গেলে এগুলো হারিয়ে যেতে পারে।
      {!storageOk && <strong className="mt-1 block text-oops">এই ব্রাউজারে এখন সেভ করা যাচ্ছে না — খেলা চলবে, কিন্তু পেজ বন্ধ করলে অগ্রগতি থাকবে না।</strong>}
    </p>
  );
}

export function AgePicker({ onPicked, compact = false }: { onPicked?: (g: BnAgeGroup) => void; compact?: boolean }) {
  const { progress } = useBnProgress();
  return (
    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`} role="radiogroup" aria-label="বয়সের দল">
      {AGE_PATHS.map((p) => {
        const on = progress.ageGroup === p.id;
        return (
          <button key={p.id} type="button" role="radio" aria-checked={on}
            onClick={() => { updateBnProgress((s) => setAgeGroup(s, p.id)); onPicked?.(p.id); }}
            className={`card flex min-h-[72px] items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 ${on ? "border-math bg-math/10" : ""}`}>
            <span className="text-4xl" aria-hidden="true">{p.emoji}</span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold">{p.label}</span>
              <span className="block font-bold">{p.title}</span>
              <span className="block text-sm font-semibold text-muted">{p.description}</span>
            </span>
            {on && <span className="ml-auto text-2xl" aria-hidden="true">✅</span>}
          </button>
        );
      })}
    </div>
  );
}

export function AgePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="তোমার বয়স কত?">
      <p className="mb-4 text-muted">এটা শুধু শুরু করার পরামর্শ। সব খেলাই সবার জন্য খোলা — যেকোনো সময় বদলাতে পারবে।</p>
      <AgePicker compact onPicked={onClose} />
    </Modal>
  );
}

export function LevelTabs({ value, onChange, best }: { value: BnLevel; onChange: (l: BnLevel) => void; best?: (l: BnLevel) => number | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="কঠিনতার স্তর">
      {([1, 2, 3] as BnLevel[]).map((l) => {
        const b = best?.(l);
        return (
          <button key={l} type="button" role="radio" aria-checked={value === l} onClick={() => onChange(l)}
            className={`min-h-[56px] rounded-2xl border-[3px] px-2 py-2 font-display text-lg font-semibold transition ${value === l ? "border-math bg-math/15" : "border-line bg-surface"}`}>
            {LEVEL_NAME[l]}
            {b !== undefined && <span className="block text-xs font-bold text-muted">{b >= 60 ? "✅ " : ""}সেরা {toBn(b)}%</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Objects in rows of five (easy to count). Purely visual; the meaning is in `label`. */
export function ObjectGroup({ emoji, count, label, faded = 0, className = "" }: { emoji: string; count: number; label?: string; faded?: number; className?: string }) {
  return (
    <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}
      className={`inline-grid grid-cols-5 gap-0.5 text-3xl leading-none sm:text-4xl ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i >= count - faded ? "opacity-25 grayscale" : ""}>{emoji}</span>
      ))}
    </span>
  );
}

export function BadgeList({ badges }: { badges: BnBadge[] }) {
  if (!badges.length) return null;
  return (
    <section className="card grid gap-3 border-sun bg-sun/10 p-5" aria-labelledby="new-bn-badges">
      <h2 id="new-bn-badges" className="text-2xl">নতুন ব্যাজ পেয়েছ! 🏆</h2>
      <ul className="grid gap-3">
        {badges.map((b) => (
          <li key={b.id} className="flex animate-pop items-center gap-4 rounded-2xl bg-surface p-3 text-left">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sun/40 text-3xl" aria-hidden="true">{b.icon}</span>
            <span><span className="block font-display text-lg font-semibold">{b.name}</span><span className="block text-muted">{b.description}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Friendly page-level "not found" in Bangla. */
export function BnNotFound() {
  const nav = useNav();
  return (
    <div className="card grid place-items-center gap-3 px-6 py-10 text-center" role="alert">
      <span className="text-5xl" aria-hidden="true">🧭</span>
      <h1 className="text-2xl">এই পাতাটা খুঁজে পেলাম না</h1>
      <button className="btn-primary" onClick={() => nav.go(HUB)}>বাংলা গণিতে ফিরে যাও</button>
    </div>
  );
}

/** Small hook: true after the first client render (for random seeds etc.). */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
