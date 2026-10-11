"use client";
import { useState } from "react";
import { AGE_BANDS, findHubStory, findPoem, HUB, HUB_STORIES, isDone, POEMS, type AgeBand, type HubStory, type Poem } from "@/core/hub";
import { Link, useNav } from "@/nav/nav";
import { useHubProgress } from "@/state/hubStore";
import { BORDER, TINT } from "@/ui/colors";
import { ReadAlong } from "@/ui/ReadAlong";
import { HubNotFound, HubShell, PageTitle, QuizCallout, useMarker } from "./shared";

const POEM_SOURCE: Record<Poem["source"], string> = {
  original: "✏️ মৌলিক ছড়া — Kids Daily Learning-এর জন্য লেখা",
  traditional: "🌾 প্রচলিত লোকছড়া — বহু বছর ধরে মুখে মুখে চলে আসছে",
};

const STORY_SOURCE: Record<HubStory["lang"], Record<HubStory["source"], string>> = {
  bn: { original: "✏️ মৌলিক গল্প — Kids Daily Learning-এর জন্য লেখা", retold: "📜 ঈশপের পুরোনো গল্প, নতুন করে বলা" },
  en: { original: "✏️ An original Kids Daily Learning story", retold: "📜 An old fable, retold in our own words" },
};

function Scene({ emoji, tone }: { emoji: string; tone: Poem["tone"] }) {
  return (
    <div className={`grid min-h-[120px] place-items-center rounded-3xl px-4 py-6 text-6xl tracking-widest sm:text-7xl ${TINT[tone]}`} aria-hidden="true">
      {emoji}
    </div>
  );
}

/** /shikhi/poems — grouped by age and difficulty. */
export function PoemListScreen() {
  const { progress } = useHubProgress();
  return (
    <HubShell back={{ to: HUB, label: "শিখি পাতা" }}>
      <PageTitle icon="🎵" title="কবিতা ও ছড়া" sub="বয়স অনুযায়ী সাজানো ছড়া। পড়ো, লাইন ধরে উজ্জ্বল করো, তারপর ছোট্ট প্রশ্নের উত্তর দাও।" />
      {AGE_BANDS.map((band) => (
        <section key={band.id} className="grid gap-3" aria-labelledby={`band-${band.id}`}>
          <h2 id={`band-${band.id}`} className="text-2xl">{band.label} <span className="chip align-middle">{band.level}</span></h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {POEMS.filter((p) => p.age === band.id).map((p) => {
              const read = isDone(progress, `poem-read:${p.id}`);
              const quiz = isDone(progress, `quiz:poem-${p.id}`);
              return (
                <li key={p.id}>
                  <Link to={`${HUB}/poems/${p.id}`} className={`card flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 ${BORDER[p.tone]}`}>
                    <span className={`grid place-items-center rounded-2xl py-3 text-4xl tracking-widest ${TINT[p.tone]}`} aria-hidden="true">{p.scene}</span>
                    <span className="font-display text-xl font-semibold">{p.title}</span>
                    <span className="text-sm font-semibold text-muted">{p.source === "traditional" ? "🌾 লোকছড়া" : "✏️ মৌলিক ছড়া"}</span>
                    <span className="mt-auto flex flex-wrap gap-1.5 text-sm font-bold">
                      <span className={`chip ${read ? "bg-good/20" : ""}`}>{read ? "✅" : "📖"} পড়া</span>
                      <span className={`chip ${quiz ? "bg-good/20" : ""}`}>{quiz ? "✅" : "🎯"} প্রশ্ন</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </HubShell>
  );
}

/** /shikhi/poems/[id] */
export function PoemScreen() {
  const { params } = useNav();
  const poem = findPoem(params.id ?? "");
  const { mark, toastNode } = useMarker();
  if (!poem) return <HubShell><HubNotFound /></HubShell>;
  const same = POEMS.filter((p) => p.age === poem.age);
  const next = same[same.indexOf(poem) + 1] ?? POEMS[POEMS.indexOf(poem) + 1];
  const band = AGE_BANDS.find((b) => b.id === poem.age);
  return (
    <HubShell back={{ to: `${HUB}/poems`, label: "কবিতা ও ছড়া" }}>
      <PageTitle icon="🎵" title={poem.title}>
        <p className="flex flex-wrap gap-2">
          <span className="chip">{band?.label} · {band?.level}</span>
          <span className="chip">{POEM_SOURCE[poem.source]}</span>
        </p>
      </PageTitle>
      <Scene emoji={poem.scene} tone={poem.tone} />
      <ReadAlong lines={poem.lines} lang="bn" kind="poem"
        onFinished={() => mark(`poem-read:${poem.id}`, { message: "সুন্দর পড়েছ! এবার প্রশ্নের উত্তর দাও। 🎵" })} />
      {poem.note && <p className="rounded-2xl bg-sunken px-4 py-3 font-semibold">💡 {poem.note}</p>}
      <QuizCallout quizId={`poem-${poem.id}`} lang="bn" title="ছড়ার প্রশ্ন" body="ছড়াটা মন দিয়ে পড়েছ? চলো দেখি!" />
      {next && <Link to={`${HUB}/poems/${next.id}`} className="btn-secondary w-full sm:w-fit">পরের ছড়া: {next.title} →</Link>}
      {toastNode}
    </HubShell>
  );
}

type LangFilter = "all" | "bn" | "en";

/** /shikhi/stories — filter by language and level. */
export function StoryListScreen() {
  const { progress } = useHubProgress();
  const [lang, setLang] = useState<LangFilter>("all");
  const [age, setAge] = useState<AgeBand | "all">("all");
  const list = HUB_STORIES.filter((s) => (lang === "all" || s.lang === lang) && (age === "all" || s.age === age));
  const tab = (on: boolean) => `min-h-[48px] rounded-2xl border-[3px] px-3 font-display text-base font-semibold ${on ? "border-creativity bg-creativity/15" : "border-line bg-surface"}`;
  return (
    <HubShell back={{ to: HUB, label: "শিখি পাতা" }}>
      <PageTitle icon="📚" title="গল্পের বই · Storybooks" sub="বাংলা ও ইংরেজি ছোট গল্প। পড়ো, লাইন ধরে উজ্জ্বল করো, তারপর প্রশ্নের উত্তর দাও।" />
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ভাষা · Language">
          {([["all", "সব · All"], ["bn", "বাংলা"], ["en", "English"]] as const).map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={lang === k} onClick={() => setLang(k)} className={tab(lang === k)}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="বয়স · Level">
          <button type="button" role="radio" aria-checked={age === "all"} onClick={() => setAge("all")} className={tab(age === "all")}>সব বয়স · All ages</button>
          {AGE_BANDS.map((b) => (
            <button key={b.id} type="button" role="radio" aria-checked={age === b.id} onClick={() => setAge(b.id)} className={tab(age === b.id)}>{b.label}</button>
          ))}
        </div>
      </div>
      {list.length === 0
        ? <p className="card p-5 text-center font-bold">এই বাছাইয়ে কোনো গল্প নেই — অন্য বয়স বা ভাষা বেছে দেখো।</p>
        : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {list.map((s) => {
              const read = isDone(progress, `story-read:${s.id}`);
              const quiz = isDone(progress, `quiz:story-${s.id}`);
              const band = AGE_BANDS.find((b) => b.id === s.age);
              return (
                <li key={s.id}>
                  <Link to={`${HUB}/stories/${s.id}`} lang={s.lang} className={`card flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 ${BORDER[s.tone]}`}>
                    <span className={`grid place-items-center rounded-2xl py-3 text-4xl tracking-widest ${TINT[s.tone]}`} aria-hidden="true">{s.scene}</span>
                    <span className="font-display text-xl font-semibold">{s.title}</span>
                    <span className="flex flex-wrap gap-1.5 text-sm font-bold" lang="bn">
                      <span className="chip">{s.lang === "bn" ? "বাংলা" : "English"}</span>
                      <span className="chip">{band?.label}</span>
                    </span>
                    <span className="mt-auto flex flex-wrap gap-1.5 text-sm font-bold" lang="bn">
                      <span className={`chip ${read ? "bg-good/20" : ""}`}>{read ? "✅" : "📖"} পড়া</span>
                      <span className={`chip ${quiz ? "bg-good/20" : ""}`}>{quiz ? "✅" : "🎯"} প্রশ্ন</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
    </HubShell>
  );
}

/** /shikhi/stories/[id] */
export function StoryScreen() {
  const { params } = useNav();
  const story = findHubStory(params.id ?? "");
  const { progress } = useHubProgress();
  const { mark, toastNode } = useMarker();
  const [finished, setFinished] = useState(false);
  if (!story) return <HubShell><HubNotFound /></HubShell>;
  const bn = story.lang === "bn";
  const read = finished || isDone(progress, `story-read:${story.id}`);
  const same = HUB_STORIES.filter((s) => s.lang === story.lang);
  const next = same[same.indexOf(story) + 1];
  const band = AGE_BANDS.find((b) => b.id === story.age);
  return (
    <HubShell lang={story.lang} back={{ to: `${HUB}/stories`, label: bn ? "গল্পের বই" : "Storybooks" }}>
      <PageTitle icon="📖" title={story.title}>
        <p className="flex flex-wrap gap-2" lang="bn">
          <span className="chip">{bn ? "বাংলা" : "English"}</span>
          <span className="chip">{band?.label} · {band?.level}</span>
          <span className="chip" lang={story.lang}>{STORY_SOURCE[story.lang][story.source]}</span>
        </p>
      </PageTitle>
      <Scene emoji={story.scene} tone={story.tone} />
      <ReadAlong lines={story.paragraphs} lang={story.lang} kind="story"
        onFinished={() => { setFinished(true); mark(`story-read:${story.id}`, { message: bn ? "গল্প পড়া শেষ! দারুণ! 📚" : "You finished the story! 📚" }); }} />
      {read
        ? <p className="card border-sun/60 bg-sun/10 p-4 text-lg font-bold">🌟 {bn ? "গল্পের শিক্ষা" : "The lesson"}: {story.moral}</p>
        : <p className="text-center text-sm font-bold text-muted">{bn ? "গল্প শেষ করলে এর শিক্ষাটা দেখতে পাবে।" : "Finish the story to see its lesson."}</p>}
      <QuizCallout quizId={`story-${story.id}`} lang={story.lang} title={bn ? "গল্পের প্রশ্ন" : "Story questions"}
        body={bn ? "গল্পে কী হয়েছিল মনে আছে? চলো দেখি!" : "Do you remember what happened? Let's see!"} />
      {next && <Link to={`${HUB}/stories/${next.id}`} className="btn-secondary w-full sm:w-fit">{bn ? "পরের গল্প" : "Next story"}: {next.title} →</Link>}
      {toastNode}
    </HubShell>
  );
}
