"use client";
import { toBn } from "@/core/bangla";
import { countDone, findFolder, FOLDERS, HUB, MATH_PUZZLES, type FolderId } from "@/core/hub";
import { Link } from "@/nav/nav";
import { useBnProgress } from "@/state/bnGuestStore";
import { useHubProgress } from "@/state/hubStore";
import { BORDER } from "@/ui/colors";
import { Blob, ProgressBar, Skeleton, StatChip } from "@/ui/primitives";
import { useChildData } from "@/state/useChild";
import { SubjectCards } from "@/screens/child/LearnScreens";
import { FolderCard, HubNotFound, HubShell, PageTitle, SectionCard, useAllStars, useFolderProgress } from "./shared";

/** /shikhi — the five learning folders. */
export function HubHomeScreen() {
  return (
    <HubShell>
      <PageTitle icon="📚" title="শিখি · Learn" sub="পাঁচটি ফোল্ডার থেকে যেটা খুশি বেছে নাও। ছবি দেখে, শুনে, লিখে আর খেলে শেখো — লগইন লাগবে না।">
        <p className="text-muted" lang="en">Pick any of the five folders. Learn with pictures, tracing, reading and quizzes — no login needed.</p>
      </PageTitle>
      <section aria-label="Learning folders" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FOLDERS.map((f) => <FolderCard key={f.id} folder={f} />)}
      </section>
      <MoreSubjects />
      <Link to={`${HUB}/progress`} className="btn-secondary w-full sm:w-fit">🏆 আমার অগ্রগতি · My progress</Link>
    </HubShell>
  );
}

/** The original six subjects, below the five folders. Content is public, so guests see them too. */
function MoreSubjects() {
  const { progress, content } = useChildData();
  return (
    <section aria-labelledby="more-subjects-h" className="grid gap-3">
      <div>
        <h2 id="more-subjects-h" className="text-2xl">More Subjects · <span lang="bn">আরও বিষয়</span></h2>
        <p className="font-semibold text-muted" lang="en">English, Mathematics, Science, General Knowledge, Creativity and Good Habits</p>
      </div>
      {content ? <SubjectCards content={content} progress={progress} titleAs="h3" /> : <Skeleton className="h-48" />}
    </section>
  );
}

/** /shikhi/bangla and /shikhi/english — the subsections of a folder. */
export function FolderScreen({ folderId }: { folderId: Extract<FolderId, "bangla" | "english"> }) {
  const folder = findFolder(folderId);
  const prog = useFolderProgress();
  if (!folder) return <HubShell><HubNotFound /></HubShell>;
  const p = prog(folder);
  const lang = folder.lang;
  return (
    <HubShell lang={lang} back={{ to: HUB, label: lang === "bn" ? "শিখি পাতা" : "Learn" }}>
      <PageTitle icon={folder.icon} title={folder.title} sub={folder.description}>
        <div className="max-w-md">
          <ProgressBar value={p.done} max={p.total} tone={folder.tone} label={`${folder.en} progress`} />
          <p className="mt-1 text-sm font-bold text-muted">{lang === "bn" ? `${toBn(p.done)}/${toBn(p.total)} শেষ` : `${p.done}/${p.total} done`}</p>
        </div>
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {folder.sections.map((s) => <SectionCard key={s.id} section={s} tone={folder.tone} lang={lang} />)}
      </div>
    </HubShell>
  );
}

export function BanglaFolderScreen() { return <FolderScreen folderId="bangla" />; }
export function EnglishFolderScreen() { return <FolderScreen folderId="english" />; }

/** /shikhi/math — the Bangla-math folder; lessons live in /bangla-math. */
export function MathFolderScreen() {
  const folder = findFolder("math")!;
  const p = useFolderProgress()(folder);
  return (
    <HubShell back={{ to: HUB, label: "শিখি পাতা" }}>
      <PageTitle icon={folder.icon} title={folder.title} sub="বাংলা অঙ্কে ১ থেকে ১০০, তারপর যোগ, বিয়োগ, গুণ আর ভাগ। দরকার হলে ইংরেজি অঙ্কও (1, 2, 3) পাশে দেখানো হয়।">
        <div className="max-w-md">
          <ProgressBar value={p.done} max={p.total} tone={folder.tone} label="Bangla math progress" />
          <p className="mt-1 text-sm font-bold text-muted">{toBn(p.done)}/{toBn(p.total)} শেষ</p>
        </div>
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {folder.sections.map((s) => <SectionCard key={s.id} section={s} tone={folder.tone} lang="bn" />)}
      </div>
      <Link to="/bangla-math" className="btn-secondary w-full sm:w-fit">🔢 বাংলা গণিতের সব খেলা</Link>
    </HubShell>
  );
}

/** /shikhi/math/puzzles — picture puzzles (level-1 Bangla-math quizzes). */
export function MathPuzzlesScreen() {
  const { progress } = useBnProgress();
  return (
    <HubShell back={{ to: `${HUB}/math`, label: "বাংলা গণিত" }}>
      <PageTitle icon="🧩" title="ছবির ধাঁধা ও কুইজ" sub="ছবি গুনে উত্তর দাও। প্রতিটি সঠিক উত্তরে একটি ⭐।" />
      <div className="grid gap-3 sm:grid-cols-2">
        {MATH_PUZZLES.map((z) => {
          const best = progress.quizzes[z.id]?.bestPct;
          return (
            <Link key={z.id} to={z.href} className={`card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 ${BORDER.gk}`}>
              <Blob tone="gk" emoji={z.icon} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl font-semibold">{z.title}</span>
                <span className="block text-sm font-semibold text-muted">{z.description}</span>
                {best !== undefined && <span className="chip mt-1 bg-sunken">{best >= 60 ? "✅ " : ""}সেরা {toBn(best)}%</span>}
              </span>
              <span className="text-2xl" aria-hidden="true">→</span>
            </Link>
          );
        })}
      </div>
    </HubShell>
  );
}

/** /shikhi/progress — everything learned on this device. */
export function HubProgressScreen() {
  const { stars } = useAllStars();
  const { progress } = useHubProgress();
  const bn = useBnProgress().progress;
  const prog = useFolderProgress();
  const quizzesPassed = Object.values(progress.quizzes).filter((q) => q.best >= 60).length;
  const traced = progress.done.filter((d) => d.startsWith("trace:")).length;
  return (
    <HubShell back={{ to: HUB, label: "শিখি পাতা" }}>
      <PageTitle icon="🏆" title="আমার অগ্রগতি · My progress" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon="⭐" value={toBn(stars)} label="মোট তারা · Stars" />
        <StatChip icon="🎯" value={toBn(quizzesPassed)} label="কুইজ পার · Quizzes" tone="math" />
        <StatChip icon="✍️" value={toBn(traced)} label="অক্ষর লেখা · Traced" tone="english" />
        <StatChip icon="🔢" value={toBn(bn.stars)} label="গণিতের তারা · Math" tone="gk" />
      </div>
      <section className="grid gap-3" aria-labelledby="folders-h">
        <h2 id="folders-h" className="text-2xl">ফোল্ডার · Folders</h2>
        {FOLDERS.map((f) => {
          const p = prog(f);
          return (
            <Link key={f.id} to={f.href} className={`card grid gap-2 p-4 ${BORDER[f.tone]}`}>
              <span className="flex items-center gap-3">
                <Blob tone={f.tone} emoji={f.icon} size="sm" />
                <span className="font-display text-xl font-semibold">{f.title}</span>
                <span className="ml-auto text-sm font-bold text-muted">{toBn(p.done)}/{toBn(p.total)}</span>
              </span>
              <ProgressBar value={p.done} max={p.total} tone={f.tone} size="sm" label={`${f.en}: ${p.done} of ${p.total}`} />
              {f.id !== "math" && f.sections.length > 1 && (
                <span className="flex flex-wrap gap-1.5">
                  {f.sections.map((s) => {
                    const c = countDone(progress, s.items);
                    return <span key={s.id} className={`chip ${c.done >= c.total ? "bg-good/20" : ""}`}>{s.icon} {s.title} {toBn(c.done)}/{toBn(c.total)}</span>;
                  })}
                </span>
              )}
            </Link>
          );
        })}
      </section>
      <Link to="/bangla-math/progress" className="btn-secondary w-full sm:w-fit">🔢 গণিতের ব্যাজ দেখো</Link>
    </HubShell>
  );
}
