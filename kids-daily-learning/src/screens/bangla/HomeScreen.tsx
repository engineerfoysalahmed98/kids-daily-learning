"use client";
import { agePath, instructionFor, LEVEL_NAME, OP_LESSONS, orderedTopics, passed, suggestedLevel, toBn, TOPIC_META, type BnTopic } from "@/core/bangla";
import { Link } from "@/nav/nav";
import { useBnProgress } from "@/state/bnGuestStore";
import { Blob } from "@/ui/primitives";
import { BORDER } from "@/ui/colors";
import { AgePicker, BanglaShell, HUB } from "./shared";

const TOPIC_BLURB: Record<BnTopic, string> = {
  numbers: "১ থেকে ১০০ — বাংলা ও ইংরেজি অঙ্ক, নাম আর গোনা",
  add: OP_LESSONS.add.intro[0],
  sub: OP_LESSONS.sub.intro[0],
  mul: OP_LESSONS.mul.intro[0],
  div: OP_LESSONS.div.intro[0],
};

export function topicHref(topic: BnTopic): string {
  return topic === "numbers" ? `${HUB}/numbers` : `${HUB}/learn/${topic}`;
}

function HomeBody() {
  const { progress, loaded } = useBnProgress();
  const path = agePath(progress.ageGroup);
  const topics = orderedTopics(progress.ageGroup);
  return (
    <>
      <section className="grid gap-2">
        <p className="chip w-fit bg-science/15">🇧🇩 বাংলায় শিখি · লগইন লাগবে না</p>
        <h1 className="text-3xl sm:text-4xl">বাংলা সংখ্যা ও গণিত 🔢</h1>
        <p className="max-w-2xl text-lg text-muted">১ থেকে ১০০ পর্যন্ত সংখ্যা, তারপর যোগ, বিয়োগ, গুণ আর ভাগ — ছবি দেখে, গুনে গুনে, খেলতে খেলতে।</p>
      </section>

      {loaded && !path && (
        <section className="card grid gap-4 border-math/40 p-5" aria-labelledby="age-q">
          <h2 id="age-q" className="text-2xl">শুরু করার আগে বলো, তোমার বয়স কত? 🎂</h2>
          <p className="text-muted">বয়স অনুযায়ী আমরা সহজ বা একটু কঠিন খেলা আগে দেখাব। পরে যেকোনো সময় বদলাতে পারবে।</p>
          <AgePicker />
        </section>
      )}

      {path && (
        <p className="rounded-2xl bg-math/10 px-4 py-3 font-bold">
          {path.emoji} {path.title} ({path.label}) — {instructionFor(progress.ageGroup)}
        </p>
      )}

      <section aria-labelledby="topics" className="grid gap-4">
        <h2 id="topics" className="sr-only">বিষয়</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map(({ topic, recommended }) => {
            const meta = TOPIC_META[topic];
            const level = suggestedLevel(progress.ageGroup, topic);
            const done = ([1, 2, 3] as const).filter((l) => passed(progress, `${topic}-${l}`)).length;
            return (
              <Link key={topic} to={topicHref(topic)} className={`card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 ${BORDER[meta.tone]} ${recommended ? "ring-4 ring-sun/50" : ""}`}>
                <div className="flex items-center gap-4">
                  <Blob tone={meta.tone} emoji={meta.icon} size="lg" />
                  <div className="min-w-0">
                    {recommended && <span className="chip mb-1 bg-sun/40 text-xs">⭐ তোমার জন্য</span>}
                    <h3 className="text-2xl">{meta.bn} <span className="text-base font-bold text-muted">· {meta.en}</span></h3>
                    <p className="text-sm font-bold text-muted">{TOPIC_BLURB[topic]}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-muted">
                  শুরু: {LEVEL_NAME[level]} স্তর · {done ? `${toBn(done)}/৩ স্তর পার ✅` : "এখনো শুরু করোনি — চেষ্টা করো! ✨"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <Link to={`${HUB}/progress`} className="btn-secondary w-full sm:w-fit">🏆 আমার তারা আর ব্যাজ দেখো</Link>
    </>
  );
}

export function BanglaHomeScreen() {
  return <BanglaShell><HomeBody /></BanglaShell>;
}
