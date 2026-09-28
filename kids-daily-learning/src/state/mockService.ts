/**
 * MOCK DATA SERVICE — runs entirely in the browser for the demo and for local
 * UI development without a database. It enforces the same rules as the API
 * (validation, parent/child separation, ownership checks, Buddy rate limits)
 * so the UI behaves identically in both modes.
 *
 * ▶ PRODUCTION: replace with ApiDataService (NEXT_PUBLIC_DATA_MODE=api).
 */
import type { Child, ChildProgress, CompletionResult, ContentStore, Parent, ParentNotification } from "@/core/types";
import { ALL_TRACKS } from "@/core/types";
import { defaultContent } from "@/core/content";
import { completeActivity, dayKey, resolveActivity, type CompletionInput } from "@/core/engine";
import { checkChildMessage } from "@/core/buddy/safety";
import { mockBuddyReply } from "@/core/buddy/mockBuddy";
import { checkAge, checkChildName, checkDisplayName, checkEmail, checkPassword, checkPin, cleanText, LIMITS } from "@/core/validation";
import type { BuddyAnswer, ChildPatch, DataService, NewChildInput, Session } from "./service";
import { ServiceError } from "./service";
import { createSeed, DEMO_LOGIN, type MockDB, type MockParentRecord } from "./mockSeed";

const STORAGE_KEY = "kdl-demo-v1";
const BUDDY_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

async function sha256(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Insecure contexts lack SubtleCrypto; the demo still works (mock only).
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
    return `weak-${h >>> 0}`;
  }
}
const hashPassword = (email: string, pw: string) => sha256(`kdl-demo|${email.toLowerCase()}|${pw}`);

function uid(): string {
  try { return crypto.randomUUID(); } catch { return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
}

/** Hand out copies so UI state never aliases the store. */
const clone = <T,>(x: T): T => structuredClone(x);

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function toParent(p: MockParentRecord): Parent {
  return { id: p.id, email: p.email, displayName: p.displayName, createdAt: p.createdAt, notifications: p.notifications, hasPin: !!p.pinHash, role: p.role };
}

export class MockDataService implements DataService {
  readonly mode = "mock" as const;
  private db: MockDB | null = null;
  private loading: Promise<MockDB> | null = null;
  private listeners = new Set<() => void>();

  private async load(): Promise<MockDB> {
    if (this.db) return this.db;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          if (raw) {
            const parsed = JSON.parse(raw) as MockDB;
            if (parsed.version === 1) { this.db = parsed; return parsed; }
          }
        } catch { /* storage unavailable — fall through to a fresh seed */ }
        const seeded = createSeed(defaultContent(), await hashPassword(DEMO_LOGIN.email, DEMO_LOGIN.password));
        this.db = seeded;
        this.persist();
        return seeded;
      })();
    }
    return this.loading;
  }

  private persist() {
    try { if (this.db) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db)); } catch { /* in-memory only */ }
  }

  private changed() {
    this.persist();
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  // ------------------------------------------------------------ guards

  private async requireParent(): Promise<{ db: MockDB; parent: MockParentRecord }> {
    const db = await this.load();
    const parent = db.parents.find((p) => p.id === db.session.parentId);
    if (!parent) throw new ServiceError("Please log in to continue.", 401);
    return { db, parent };
  }

  /** Parent-only actions are blocked while the device is in child mode. */
  private async requireParentMode() {
    const ctx = await this.requireParent();
    if (ctx.db.session.mode === "child") throw new ServiceError("Ask a grown-up to unlock the parent area.", 403);
    return ctx;
  }

  /** A child's data is visible only to their own parent (no cross-family access). */
  private async requireChild(childId: string, opts: { childSelfOk: boolean }) {
    const { db, parent } = await this.requireParent();
    const child = db.children.find((c) => c.id === childId && c.parentId === parent.id);
    if (!child) throw new ServiceError("Profile not found.", 404);
    if (db.session.mode === "child" && (!opts.childSelfOk || db.session.childId !== childId)) {
      throw new ServiceError("This belongs to another profile.", 403);
    }
    return { db, parent, child };
  }

  // ------------------------------------------------------------ auth

  async getSession(): Promise<Session> {
    const db = await this.load();
    const parent = db.parents.find((p) => p.id === db.session.parentId);
    return { parent: parent ? toParent(parent) : null, activeChildId: parent ? db.session.childId : null, mode: parent ? db.session.mode : null };
  }

  async signUp(input: { email: string; password: string; displayName: string }): Promise<Parent> {
    await delay(300);
    const db = await this.load();
    const email = input.email.trim().toLowerCase();
    const err = checkEmail(email) ?? checkPassword(input.password) ?? checkDisplayName(input.displayName);
    if (err) throw new ServiceError(err, 400);
    if (db.parents.some((p) => p.email === email)) throw new ServiceError("An account with this email already exists. Try logging in.", 409, "email");
    const rec: MockParentRecord = {
      id: uid(), email, displayName: cleanText(input.displayName, 40), passwordHash: await hashPassword(email, input.password),
      pinHash: null, createdAt: new Date().toISOString(), notifications: { activity: true, badge: true, goal: true }, role: "PARENT",
    };
    db.parents.push(rec);
    db.session = { parentId: rec.id, childId: null, mode: "parent" };
    this.changed();
    return toParent(rec);
  }

  async logIn(input: { email: string; password: string }): Promise<Parent> {
    await delay(300);
    const db = await this.load();
    const email = input.email.trim().toLowerCase();
    const rec = db.parents.find((p) => p.email === email);
    // Same message for unknown email and wrong password (no account enumeration).
    if (!rec || rec.passwordHash !== (await hashPassword(email, input.password))) throw new ServiceError("That email and password don't match. Try again.", 401);
    db.session = { parentId: rec.id, childId: null, mode: "parent" };
    this.changed();
    return toParent(rec);
  }

  async logOut(): Promise<void> {
    const db = await this.load();
    db.session = { parentId: null, childId: null, mode: null };
    this.changed();
  }

  // ------------------------------------------------------------ children

  async listChildren(): Promise<Child[]> {
    await delay();
    const { db, parent } = await this.requireParent();
    return clone(db.children.filter((c) => c.parentId === parent.id));
  }

  async createChild(input: NewChildInput): Promise<Child> {
    await delay(200);
    const { db, parent } = await this.requireParentMode();
    const err = checkChildName(input.name) ?? checkAge(input.age);
    if (err) throw new ServiceError(err, 400);
    if (db.children.filter((c) => c.parentId === parent.id).length >= LIMITS.maxChildren) throw new ServiceError(`You can add up to ${LIMITS.maxChildren} children.`, 400);
    const child: Child = {
      id: uid(), parentId: parent.id, name: cleanText(input.name, LIMITS.nameMax), age: input.age, avatar: input.avatar || "🦁",
      createdAt: new Date().toISOString(),
      settings: { dailyGoal: 5, screenTimeMinutes: input.age < 8 ? 45 : 60, allowedTracks: [...ALL_TRACKS], aiEnabled: true, soundOn: true, largeText: false },
    };
    db.children.push(child);
    db.progress[child.id] = { completions: [], badges: [], streak: { current: 0, longest: 0, lastDay: null }, usage: {} };
    this.changed();
    return clone(child);
  }

  async updateChild(id: string, patch: ChildPatch): Promise<Child> {
    await delay();
    const { child } = await this.requireChild(id, { childSelfOk: false });
    if (patch.name !== undefined) { const e = checkChildName(patch.name); if (e) throw new ServiceError(e, 400); child.name = cleanText(patch.name, LIMITS.nameMax); }
    if (patch.age !== undefined) { const e = checkAge(patch.age); if (e) throw new ServiceError(e, 400); child.age = patch.age; }
    if (patch.avatar !== undefined) child.avatar = patch.avatar;
    if (patch.settings) {
      const s = { ...child.settings, ...patch.settings };
      s.dailyGoal = Math.min(7, Math.max(1, Math.round(s.dailyGoal)));
      s.screenTimeMinutes = Math.min(240, Math.max(0, Math.round(s.screenTimeMinutes)));
      s.allowedTracks = s.allowedTracks.filter((t) => ALL_TRACKS.includes(t));
      child.settings = s;
    }
    this.changed();
    return clone(child);
  }

  async deleteChild(id: string): Promise<void> {
    await delay();
    const { db } = await this.requireChild(id, { childSelfOk: false });
    db.children = db.children.filter((c) => c.id !== id);
    delete db.progress[id];
    delete db.buddyLog[id];
    db.notifications = db.notifications.filter((n) => n.childId !== id);
    if (db.session.childId === id) db.session.childId = null;
    this.changed();
  }

  async enterChildMode(childId: string): Promise<void> {
    const { db } = await this.requireChild(childId, { childSelfOk: true });
    db.session.childId = childId;
    db.session.mode = "child";
    this.changed();
  }

  async exitChildMode(pin?: string): Promise<void> {
    const { db, parent } = await this.requireParent();
    if (parent.pinHash && (!pin || (await sha256(`pin|${parent.id}|${pin}`)) !== parent.pinHash)) throw new ServiceError("That PIN isn't right.", 403);
    db.session.mode = "parent";
    this.changed();
  }

  // ------------------------------------------------------------ learning

  async getContent(): Promise<ContentStore> {
    const db = await this.load();
    return clone(db.content);
  }

  async getProgress(childId: string): Promise<ChildProgress> {
    await delay(80);
    const { db, child } = await this.requireChild(childId, { childSelfOk: true });
    const p = db.progress[childId];
    return clone({ child, completions: p.completions, badges: p.badges, streak: p.streak, usage: p.usage });
  }

  async submitCompletion(childId: string, activityId: string, input: CompletionInput): Promise<CompletionResult> {
    await delay(250);
    const { db, parent, child } = await this.requireChild(childId, { childSelfOk: true });
    const p = db.progress[childId];
    const progress: ChildProgress = { child, ...p };
    // Rebuild the activity from its id — the client never sends a score.
    const activity = resolveActivity({ child, history: p.completions, content: db.content }, activityId);
    if (!activity) throw new ServiceError("We couldn't find that activity.", 404);
    const today = dayKey();
    let out;
    try {
      out = completeActivity(progress, activity, input, { now: new Date(), today, badges: db.content.badges, newId: uid });
    } catch (e) {
      throw new ServiceError((e as Error).message, 400);
    }
    db.progress[childId] = { completions: out.progress.completions, badges: out.progress.badges, streak: out.progress.streak, usage: p.usage };
    for (const n of out.notifications) {
      if (n.kind !== "safety" && !parent.notifications[n.kind]) continue; // parent controls notifications
      db.notifications.unshift({ id: uid(), parentId: parent.id, childId, kind: n.kind, text: n.text, createdAt: new Date().toISOString(), read: false });
    }
    db.notifications = db.notifications.slice(0, 100);
    this.changed();
    return clone(out.result);
  }

  async addUsage(childId: string, seconds: number): Promise<void> {
    const { db } = await this.requireChild(childId, { childSelfOk: true });
    if (seconds < 0 && db.session.mode === "child") throw new ServiceError("Only a grown-up can add more time.", 403);
    const day = dayKey();
    const usage = db.progress[childId].usage;
    usage[day] = Math.max(0, (usage[day] ?? 0) + Math.max(-3600, Math.min(120, seconds)));
    this.persist(); // no re-render storm for the usage ticker
  }

  async askBuddy(childId: string, message: string): Promise<BuddyAnswer> {
    await delay(500);
    const { db, child } = await this.requireChild(childId, { childSelfOk: true });
    if (!child.settings.aiEnabled) throw new ServiceError("Buddy is switched off by your grown-up.", 403);
    const now = Date.now();
    const log = (db.buddyLog[childId] ?? []).filter((t) => now - t < BUDDY_LIMIT.windowMs);
    if (log.length >= BUDDY_LIMIT.max) {
      return { text: "Buddy needs a little rest! Let's try again in a few minutes. Meanwhile, why not finish an activity? 🌟", blocked: true, remaining: 0 };
    }
    log.push(now);
    db.buddyLog[childId] = log;
    this.persist();
    const text = cleanText(message, LIMITS.buddyMax);
    const verdict = checkChildMessage(text);
    if (!verdict.ok) {
      if (verdict.notifyParent) {
        // Safety alerts can't be switched off. The child's words are not stored.
        db.notifications.unshift({ id: uid(), parentId: child.parentId, childId, kind: "safety", text: `${child.name} told Buddy something that suggests they may be upset. You may want to check in with them. 💛`, createdAt: new Date().toISOString(), read: false });
        this.changed();
      }
      return { text: verdict.reply, blocked: true, remaining: BUDDY_LIMIT.max - log.length };
    }
    // ▶ PRODUCTION: POST /api/buddy → src/server/buddy.ts (model call + output filter)
    return { ...mockBuddyReply(text, { name: child.name, age: child.age, vocab: db.content.vocab }), remaining: BUDDY_LIMIT.max - log.length };
  }

  // ------------------------------------------------------------ parent

  async listNotifications(): Promise<ParentNotification[]> {
    const { db, parent } = await this.requireParentMode();
    return clone(db.notifications.filter((n) => n.parentId === parent.id));
  }

  async markNotificationsRead(): Promise<void> {
    const { db, parent } = await this.requireParentMode();
    db.notifications.forEach((n) => { if (n.parentId === parent.id) n.read = true; });
    this.changed();
  }

  async updateParent(patch: { displayName?: string; notifications?: Partial<Parent["notifications"]> }): Promise<Parent> {
    const { parent } = await this.requireParentMode();
    if (patch.displayName !== undefined) { const e = checkDisplayName(patch.displayName); if (e) throw new ServiceError(e); parent.displayName = cleanText(patch.displayName, 40); }
    if (patch.notifications) parent.notifications = { ...parent.notifications, ...patch.notifications };
    this.changed();
    return toParent(parent);
  }

  async setPin(pin: string | null): Promise<void> {
    const { parent } = await this.requireParentMode();
    if (pin !== null) { const e = checkPin(pin); if (e) throw new ServiceError(e); }
    parent.pinHash = pin ? await sha256(`pin|${parent.id}|${pin}`) : null;
    this.changed();
  }

  async verifyPin(pin: string): Promise<boolean> {
    const { parent } = await this.requireParent();
    return !!parent.pinHash && (await sha256(`pin|${parent.id}|${pin}`)) === parent.pinHash;
  }

  // ------------------------------------------------------------ admin

  async saveContent<K extends keyof ContentStore>(key: K, items: ContentStore[K]): Promise<void> {
    await delay(150);
    const { db, parent } = await this.requireParentMode();
    if (parent.role !== "ADMIN") throw new ServiceError("Only content admins can edit lessons.", 403);
    db.content = { ...db.content, [key]: clone(items) };
    this.changed();
  }

  async resetDemo(): Promise<void> {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    this.db = null;
    this.loading = null;
    await this.load();
    this.changed();
  }
}
