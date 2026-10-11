"use client";
import { useCallback, useState, type ReactNode } from "react";
import { toBn } from "@/core/bangla";
import {
  awardStar, countDone, folderItems, HUB, isDone, markDone, mathCompletion, type HubFolder, type HubSection,
} from "@/core/hub";
import { Link, useNav } from "@/nav/nav";
import { useBnProgress } from "@/state/bnGuestStore";
import { updateHubProgress, useHubProgress } from "@/state/hubStore";
import { Logo } from "@/ui/brand";
import { BORDER } from "@/ui/colors";
import { Blob, ProgressBar, Toast } from "@/ui/primitives";

export type Lang = "bn" | "en";

/** Number in the page language. */
export const num = (n: number, lang: Lang) => (lang === "bn" ? toBn(n) : String(n));

/** Stars from the hub plus the Bangla-math section (both live on this device). */
export function useAllStars(): { stars: number; loaded: boolean } {
  const hub = useHubProgress();
  const bn = useBnProgress();
  return { stars: hub.progress.stars + bn.progress.stars, loaded: hub.loaded && bn.loaded };
}

/** Completion of one folder; math is read from the Bangla-math store. */
export function useFolderProgress(): (f: HubFolder) => { done: number; total: number } {
  const { progress } = useHubProgress();
  const bn = useBnProgress().progress;
  return (f) => (f.id === "math" ? mathCompletion(bn) : countDone(progress, folderItems(f)));
}

/**
 * Frame for every শিখি page: no login, stars always visible, a clear way
 * back, and an honest note about where progress is saved.
 */
export function HubShell({ children, back, lang = "bn" }: { children: ReactNode; back?: { to: string; label: string }; lang?: Lang }) {
  const { stars, loaded } = useAllStars();
  return (
    <div lang={lang} className="min-h-dvh bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">
        {lang === "bn" ? "মূল অংশে যাও" : "Skip to content"}
      </a>
      <header className="sticky top-0 z-30 border-b-2 border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
          <Link to="/" aria-label="Kids Daily Learning — Home" className="shrink-0"><Logo compact /></Link>
          <Link to={HUB} className="inline-flex min-h-[44px] items-center rounded-xl px-2 font-display text-lg font-semibold" lang="bn">📚 শিখি</Link>
          <div className="ml-auto flex items-center gap-2">
            <Link to={`${HUB}/progress`} className="chip min-h-[44px] bg-sun/30 px-3"
              aria-label={lang === "bn" ? `আমার অগ্রগতি — মোট ${toBn(stars)}টি তারা` : `My progress — ${stars} stars`}>
              ⭐ <span className="tnum">{loaded ? num(stars, lang) : "…"}</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 pt-5">
        {back && <Link to={back.to} className="btn-ghost btn-sm -ml-2 w-fit">← {back.label}</Link>}
        {children}
        <HubSaveNote />
      </main>
    </div>
  );
}

export function HubSaveNote() {
  const { storageOk } = useHubProgress();
  return (
    <p className="rounded-2xl bg-sunken px-4 py-3 text-sm font-semibold text-muted" lang="bn">
      🔒 লগইন বা ইমেইল লাগে না। তারা আর অগ্রগতি শুধু এই ডিভাইসে রাখা হয় — ব্রাউজারের ডেটা মুছলে বা অন্য ডিভাইসে গেলে হারিয়ে যেতে পারে।
      <span className="block" lang="en">No login or email needed. Progress is saved on this device only.</span>
      {!storageOk && <strong className="mt-1 block text-oops">এই ব্রাউজারে এখন সেভ করা যাচ্ছে না — শেখা চলবে, কিন্তু পেজ বন্ধ করলে অগ্রগতি থাকবে না।</strong>}
    </p>
  );
}

export function PageTitle({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h1 className="flex flex-wrap items-center gap-3 text-3xl sm:text-4xl"><span aria-hidden="true">{icon}</span>{title}</h1>
      {sub && <p className="max-w-2xl text-lg text-muted">{sub}</p>}
      {children}
    </section>
  );
}

export function DonePill({ done, total, lang }: { done: number; total: number; lang: Lang }) {
  if (!total) return null;
  const all = done >= total;
  return (
    <span className={`chip w-fit ${all ? "bg-good/20" : "bg-sunken"}`}>
      {all ? "✅" : "📈"} {num(done, lang)}/{num(total, lang)} {lang === "bn" ? "শেষ" : "done"}
    </span>
  );
}

/** Big colorful folder card on the hub page. The whole card is one link. */
export function FolderCard({ folder }: { folder: HubFolder }) {
  const prog = useFolderProgress()(folder);
  const lang: Lang = folder.lang;
  return (
    <Link to={folder.href} className={`card group flex flex-col gap-4 p-5 transition hover:-translate-y-1 ${BORDER[folder.tone]}`}>
      <div className="flex items-start gap-4">
        <Blob tone={folder.tone} emoji={folder.icon} size="lg" />
        <div className="min-w-0">
          <h2 className="text-2xl" lang={lang}>{folder.title}</h2>
          <p className="text-sm font-extrabold text-muted" lang={lang === "bn" ? "en" : "bn"}>{folder.en}</p>
          <p className="mt-1 font-semibold text-muted" lang={lang}>{folder.description}</p>
        </div>
      </div>
      <div className="grid gap-1.5">
        <ProgressBar value={prog.done} max={prog.total} tone={folder.tone} size="sm" label={`${folder.en}: ${prog.done} / ${prog.total}`} />
        <p className="text-sm font-bold text-muted">{num(prog.done, "bn")}/{num(prog.total, "bn")} শেষ · {prog.done}/{prog.total} done</p>
      </div>
      <span className="btn-primary mt-auto w-full group-hover:brightness-105">শুরু করি / Start Learning →</span>
    </Link>
  );
}

/** Subsection card inside a folder page. */
export function SectionCard({ section, tone, lang }: { section: HubSection; tone: HubFolder["tone"]; lang: Lang }) {
  const { progress } = useHubProgress();
  const p = countDone(progress, section.items);
  return (
    <Link to={section.href} className={`card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 ${BORDER[tone]}`}>
      <Blob tone={tone} emoji={section.icon} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl font-semibold">{section.title}{section.en && <span className="text-base font-bold text-muted"> · {section.en}</span>}</span>
        <span className="block text-sm font-semibold text-muted">{section.description}</span>
        {p.total > 0 && <span className="mt-1 block"><DonePill done={p.done} total={p.total} lang={lang} /></span>}
      </span>
      <span className="text-2xl" aria-hidden="true">→</span>
    </Link>
  );
}

/** Card that starts a hub quiz and shows the best score so far. */
export function QuizCallout({ quizId, lang, title, body }: { quizId: string; lang: Lang; title?: string; body?: string }) {
  const { progress, loaded } = useHubProgress();
  const best = progress.quizzes[quizId]?.best;
  const passed = isDone(progress, `quiz:${quizId}`);
  return (
    <section className="card flex flex-col gap-3 border-sun/60 bg-sun/10 p-5 sm:flex-row sm:items-center">
      <span className="text-5xl" aria-hidden="true">🎯</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl">{title ?? (lang === "bn" ? "কুইজ খেলি" : "Quiz time")}</h2>
        <p className="font-semibold text-muted">{body ?? (lang === "bn" ? "প্রতিটি সঠিক উত্তরে একটি ⭐ পাবে।" : "Every right answer earns a ⭐.")}</p>
        {loaded && best !== undefined && (
          <p className="mt-1 text-sm font-extrabold">{passed ? "✅ " : ""}{lang === "bn" ? `সেরা স্কোর ${toBn(best)}%` : `Best score ${best}%`}</p>
        )}
      </div>
      <Link to={`${HUB}/quiz/${quizId}`} className="btn-primary">{best !== undefined ? (lang === "bn" ? "🔁 আবার খেলি" : "🔁 Play again") : (lang === "bn" ? "▶️ শুরু করি" : "▶️ Start")}</Link>
    </section>
  );
}

/** Marks an item done (and optionally gives one star once). Returns a toast-able message. */
export function useMarker() {
  const [toast, setToast] = useState<string | null>(null);
  const mark = useCallback((item: string, opts?: { starKey?: string; message?: string }) => {
    let starred = false;
    updateHubProgress((p0) => {
      const p = markDone(p0, item);
      if (!opts?.starKey) return p;
      const r = awardStar(p, opts.starKey);
      starred = r.awarded;
      return r.progress;
    });
    if (opts?.message) setToast(starred ? `${opts.message} +১ ⭐` : opts.message);
  }, []);
  const node = <Toast message={toast} onDone={() => setToast(null)} />;
  return { mark, toastNode: node };
}

export function HubNotFound({ lang = "bn" }: { lang?: Lang }) {
  const nav = useNav();
  return (
    <div className="card grid place-items-center gap-3 px-6 py-10 text-center" role="alert">
      <span className="text-5xl" aria-hidden="true">🧭</span>
      <h1 className="text-2xl">{lang === "bn" ? "এই পাতাটা খুঁজে পেলাম না" : "We couldn't find that page"}</h1>
      <button type="button" className="btn-primary" onClick={() => nav.go(HUB)}>{lang === "bn" ? "শিখি পাতায় ফিরে যাও" : "Back to Learn"}</button>
    </div>
  );
}
