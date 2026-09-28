"use client";
import { useMemo, useState } from "react";
import type { ContentStore, Question } from "@/core/types";
import { useApp, useLoad } from "@/state/AppProvider";
import { Link, useNav } from "@/nav/nav";
import { Logo } from "@/ui/brand";
import { EmptyState, ErrorState, Field, Modal, Skeleton, Toast } from "@/ui/primitives";
import { checkAnswer } from "@/core/engine";

/**
 * Content admin (role ADMIN). Schema-driven CRUD for every content type.
 * Mock mode saves into the in-browser store; production PUTs to
 * /api/admin/content/:type, which validates with zod and writes to Postgres.
 */

type FieldType = "text" | "textarea" | "number" | "lines" | "bool" | "select" | "json";
interface FieldDef { key: string; label: string; type: FieldType; options?: string[]; hint?: string; }
interface TypeDef { key: keyof ContentStore; label: string; icon: string; title: (x: Record<string, unknown>) => string; sub: (x: Record<string, unknown>) => string; fields: FieldDef[]; blank: () => Record<string, unknown>; canCreate: boolean; }

const Q_HINT = 'Array of questions, e.g. [{"id":"q1","type":"mc","prompt":"…","options":["A","B"],"answer":0,"explain":"…"}]. Types: mc, tf, image, match, type, order.';

const TYPES: TypeDef[] = [
  { key: "stories", label: "Stories", icon: "📖", canCreate: true, title: (x) => String(x.title), sub: (x) => `Ages ${x.minAge}–${x.maxAge} · ${(x.questions as unknown[]).length} questions`,
    blank: () => ({ id: `story-${Date.now().toString(36)}`, title: "", minAge: 6, maxAge: 8, scene: "📚✨", sceneColor: "story", paragraphs: [""], moral: "", questions: [] }),
    fields: [
      { key: "title", label: "Title", type: "text" }, { key: "minAge", label: "Min age", type: "number" }, { key: "maxAge", label: "Max age", type: "number" },
      { key: "scene", label: "Illustration (emoji scene)", type: "text" }, { key: "sceneColor", label: "Scene color", type: "select", options: ["english", "math", "science", "gk", "story", "brain", "creativity", "habit"] },
      { key: "paragraphs", label: "Story text (one paragraph per line)", type: "lines" }, { key: "moral", label: "Lesson / moral", type: "text" },
      { key: "questions", label: "Comprehension questions (3–5)", type: "json", hint: Q_HINT },
    ] },
  { key: "units", label: "Science & World", icon: "🔬", canCreate: true, title: (x) => `${x.icon} ${x.title}`, sub: (x) => `${x.subject === "gk" ? "World" : "Science"} · ${x.topic} · Level ${x.level} · ${(x.questions as unknown[]).length} questions`,
    blank: () => ({ id: `unit-${Date.now().toString(36)}`, subject: "science", topic: "Animals", title: "", icon: "🔬", level: 2, cards: [], questions: [] }),
    fields: [
      { key: "title", label: "Title", type: "text" }, { key: "icon", label: "Icon (emoji)", type: "text" },
      { key: "subject", label: "Subject", type: "select", options: ["science", "gk"] }, { key: "topic", label: "Topic", type: "text" },
      { key: "level", label: "Level (1–5)", type: "number" },
      { key: "cards", label: "Lesson cards", type: "json", hint: 'Array of {"emoji":"🦒","title":"Giraffes","body":"…"}' },
      { key: "questions", label: "Questions", type: "json", hint: Q_HINT },
    ] },
  { key: "vocab", label: "Vocabulary", icon: "🔤", canCreate: true, title: (x) => `${x.emoji} ${x.word}`, sub: (x) => `Level ${x.level} · ${x.meaning}`,
    blank: () => ({ id: `w-${Date.now().toString(36)}`, word: "", emoji: "✨", meaning: "", example: "", level: 2 }),
    fields: [{ key: "word", label: "Word", type: "text" }, { key: "emoji", label: "Emoji", type: "text" }, { key: "meaning", label: "Meaning (kid-friendly)", type: "text" }, { key: "example", label: "Example sentence", type: "text" }, { key: "level", label: "Level (1–5)", type: "number" }] },
  { key: "creative", label: "Creative prompts", icon: "🎨", canCreate: true, title: (x) => `${x.icon} ${x.title}`, sub: (x) => `Ages ${x.minAge}+ · ${x.prompt}`,
    blank: () => ({ id: `c-${Date.now().toString(36)}`, title: "", prompt: "", icon: "🎨", tips: [""], minAge: 4 }),
    fields: [{ key: "title", label: "Title", type: "text" }, { key: "icon", label: "Icon", type: "text" }, { key: "prompt", label: "Prompt", type: "textarea" }, { key: "tips", label: "Tips (one per line)", type: "lines" }, { key: "minAge", label: "Minimum age", type: "number" }] },
  { key: "habits", label: "Good habits", icon: "🌱", canCreate: true, title: (x) => `${x.icon} ${x.title}`, sub: (x) => `Ages ${x.minAge}+ · ${(x.steps as unknown[]).length} steps`,
    blank: () => ({ id: `h-${Date.now().toString(36)}`, title: "", icon: "🌱", why: "", steps: [""], minAge: 4 }),
    fields: [{ key: "title", label: "Title", type: "text" }, { key: "icon", label: "Icon", type: "text" }, { key: "why", label: "Why it matters", type: "textarea" }, { key: "steps", label: "Steps (one per line)", type: "lines" }, { key: "minAge", label: "Minimum age", type: "number" }] },
  { key: "badges", label: "Badges", icon: "🏆", canCreate: false, title: (x) => `${x.icon} ${x.name}`, sub: (x) => String(x.description),
    blank: () => ({}),
    fields: [{ key: "name", label: "Name", type: "text" }, { key: "icon", label: "Icon", type: "text" }, { key: "description", label: "Description", type: "text" }, { key: "rule", label: "Unlock rule", type: "json", hint: 'e.g. {"kind":"track","track":"math","count":5}' }] },
  { key: "subjects", label: "Subjects", icon: "📚", canCreate: false, title: (x) => `${x.icon} ${x.name}`, sub: (x) => `${x.enabled ? "Enabled" : "Disabled"} · ${(x.topics as string[]).join(", ")}`,
    blank: () => ({}),
    fields: [{ key: "name", label: "Name", type: "text" }, { key: "icon", label: "Icon", type: "text" }, { key: "enabled", label: "Enabled for everyone", type: "bool" }, { key: "topics", label: "Topics (one per line)", type: "lines" }] },
  { key: "ageGroups", label: "Age groups", icon: "🧒", canCreate: false, title: (x) => String(x.label), sub: (x) => `Ages ${x.minAge}–${x.maxAge} · starts at level ${x.baseLevel}`,
    blank: () => ({}),
    fields: [{ key: "label", label: "Label", type: "text" }, { key: "minAge", label: "Min age", type: "number" }, { key: "maxAge", label: "Max age", type: "number" }, { key: "baseLevel", label: "Starting level (1–5)", type: "number" }] },
];

/** Admin-side validation — the API repeats these checks with zod. */
function validate(type: TypeDef, v: Record<string, unknown>): string | null {
  for (const f of type.fields) {
    const val = v[f.key];
    if ((f.type === "text" || f.type === "textarea") && !String(val ?? "").trim()) return `${f.label} is required.`;
    if (f.type === "number" && !Number.isFinite(val as number)) return `${f.label} must be a number.`;
    if (f.type === "lines" && !(val as string[]).filter(Boolean).length) return `${f.label} needs at least one line.`;
  }
  if ("level" in v && ((v.level as number) < 1 || (v.level as number) > 5)) return "Level must be 1–5.";
  if ("baseLevel" in v && ((v.baseLevel as number) < 1 || (v.baseLevel as number) > 5)) return "Starting level must be 1–5.";
  if ("minAge" in v && "maxAge" in v && (v.minAge as number) > (v.maxAge as number)) return "Min age must be ≤ max age.";
  if (Array.isArray(v.questions)) {
    for (const q of v.questions as Question[]) {
      if (!q || typeof q !== "object" || !q.id || !q.prompt || !q.type) return "Every question needs an id, type and prompt.";
      const selfCheck = q.type === "mc" ? { type: "mc" as const, choice: q.answer } : q.type === "tf" ? { type: "tf" as const, value: q.answer } : null;
      if (selfCheck && !checkAnswer(q, selfCheck)) return `Question ${q.id} has an invalid answer.`;
      if ((q.type === "mc") && (q.answer < 0 || q.answer >= q.options.length)) return `Question ${q.id}: answer index is out of range.`;
    }
  }
  return null;
}

function Editor({ type, value, onSave, onCancel }: { type: TypeDef; value: Record<string, unknown>; onSave: (v: Record<string, unknown>) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<Record<string, string | boolean>>(() => Object.fromEntries(type.fields.map((f) => {
    const v = value[f.key];
    return [f.key, f.type === "lines" ? (v as string[]).join("\n") : f.type === "json" ? JSON.stringify(v, null, 2) : f.type === "bool" ? Boolean(v) : String(v ?? "")];
  })));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, unknown> = { ...value };
    try {
      for (const f of type.fields) {
        const d = draft[f.key];
        out[f.key] = f.type === "number" ? Number(d) : f.type === "lines" ? String(d).split("\n").map((s) => s.trim()).filter(Boolean) : f.type === "json" ? JSON.parse(String(d)) : f.type === "bool" ? Boolean(d) : String(d).trim();
      }
    } catch { setErr("One of the JSON fields isn't valid JSON."); return; }
    const v = validate(type, out);
    if (v) { setErr(v); return; }
    setBusy(true);
    try { await onSave(out); } catch (x) { setErr((x as Error).message); setBusy(false); }
  }

  return (
    <form className="grid gap-4" onSubmit={save}>
      {type.fields.map((f) => {
        const id = `adm-${f.key}`;
        return (
          <Field key={f.key} label={f.label} htmlFor={id} hint={f.hint}>
            {f.type === "select" ? (
              <select id={id} className="field" value={String(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
            ) : f.type === "bool" ? (
              <input id={id} type="checkbox" className="h-6 w-6" checked={Boolean(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })} />
            ) : f.type === "textarea" || f.type === "lines" || f.type === "json" ? (
              <textarea id={id} className={`field min-h-[110px] py-3 ${f.type === "json" ? "font-mono text-sm" : ""}`} rows={f.type === "json" ? 8 : 4} value={String(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            ) : (
              <input id={id} className="field" type={f.type === "number" ? "number" : "text"} value={String(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            )}
          </Field>
        );
      })}
      {err && <p className="rounded-2xl bg-oops/10 px-4 py-3 font-bold text-oops" role="alert">{err}</p>}
      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
        <button className="btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}

export function AdminScreen() {
  const { service, session } = useApp();
  const nav = useNav();
  const content = useLoad((s) => s.getContent());
  const [tab, setTab] = useState<keyof ContentStore>("stories");
  const [editing, setEditing] = useState<{ index: number | null; value: Record<string, unknown> } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const type = TYPES.find((t) => t.key === tab)!;
  const items = useMemo(() => ((content.data?.[tab] ?? []) as unknown as Record<string, unknown>[]), [content.data, tab]);
  const filtered = items.map((x, i) => ({ x, i })).filter(({ x }) => !query || JSON.stringify(x).toLowerCase().includes(query.toLowerCase()));

  if (session && !session.parent) return <div className="grid min-h-dvh place-items-center bg-bg px-4"><EmptyState emoji="🛠️" title="Admins only" body="Log in with a content-admin account." action={<Link to="/login" className="btn-primary">Log in</Link>} /></div>;
  if (session?.parent && (session.parent.role !== "ADMIN" || session.mode === "child")) return <div className="grid min-h-dvh place-items-center bg-bg px-4"><EmptyState emoji="🔒" title="You don't have access to content admin" action={<Link to="/parent" className="btn-secondary">Back to dashboard</Link>} /></div>;

  async function persist(next: Record<string, unknown>[], msg: string) {
    await service.saveContent(tab, next as never);
    setToast(msg);
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b-2 border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/parent"><Logo compact /></Link>
          <span className="chip bg-ink text-bg">Content admin</span>
          <button className="btn-ghost btn-sm ml-auto" onClick={() => nav.go("/parent")}>← Parent area</button>
        </div>
      </header>
      <main id="main" className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Content types" className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:content-start lg:overflow-visible">
          {TYPES.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setQuery(""); }} aria-current={tab === t.key ? "page" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 font-bold ${tab === t.key ? "bg-math/15" : "text-muted hover:bg-sunken"}`}>
              <span aria-hidden="true">{t.icon}</span>{t.label}
              <span className="tnum ml-auto text-xs">{((content.data?.[t.key] as unknown[]) ?? []).length}</span>
            </button>
          ))}
        </nav>
        <section className="grid content-start gap-4" aria-labelledby="adm-title">
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="adm-title" className="text-2xl">{type.icon} {type.label}</h1>
            <label htmlFor="adm-search" className="sr-only">Search</label>
            <input id="adm-search" className="field ml-auto w-full sm:w-64" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {type.canCreate && <button className="btn-primary btn-sm" onClick={() => setEditing({ index: null, value: type.blank() })}>+ New</button>}
          </div>
          {content.error ? <ErrorState error={content.error} onRetry={content.reload} /> : !content.data ? <Skeleton className="h-72" /> : filtered.length === 0 ? (
            <EmptyState emoji="🔍" title="Nothing here yet" body={query ? "No items match your search." : "Create the first one."} />
          ) : (
            <ul className="card divide-y-2 divide-line">
              {filtered.map(({ x, i }) => (
                <li key={String(x.id ?? i)} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1"><span className="block font-bold">{type.title(x)}</span><span className="block truncate text-sm text-muted">{type.sub(x)}</span></span>
                  <button className="btn-secondary btn-sm" onClick={() => setEditing({ index: i, value: x })}>Edit</button>
                  {type.canCreate && <button className="btn-ghost btn-sm text-oops" onClick={() => setDeleting(i)}>Delete</button>}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm font-semibold text-muted">Changes apply to new daily plans immediately. Activities already started today keep their questions (plans are rebuilt from content by id).</p>
        </section>
      </main>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.index === null ? `New ${type.label.toLowerCase()}` : `Edit ${type.label.toLowerCase()}`}>
        {editing && <Editor key={`${tab}-${editing.index}`} type={type} value={editing.value} onCancel={() => setEditing(null)}
          onSave={async (v) => {
            const next = items.slice();
            if (editing.index === null) next.push(v); else next[editing.index] = v;
            await persist(next, "Saved");
            setEditing(null);
          }} />}
      </Modal>
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this item?">
        <p className="text-muted">{deleting !== null && items[deleting] ? type.title(items[deleting]) : ""} will be removed for every child.</p>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setDeleting(null)}>Cancel</button>
          <button className="btn flex-1 bg-oops text-white" onClick={async () => { const next = items.filter((_, k) => k !== deleting); await persist(next, "Deleted"); setDeleting(null); }}>Delete</button>
        </div>
      </Modal>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
