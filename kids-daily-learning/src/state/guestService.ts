/**
 * GUEST LEARNING — lets visitors learn without an account.
 *
 * Wraps the real DataService (API or mock). While a parent is logged in every
 * call goes straight through, unchanged. With nobody logged in, the learning
 * calls (progress, completions, screen time) run on this device against one
 * local guest learner, using the same engine that scores completions on the
 * server. Guest data never reaches the database and needs no account.
 *
 * Parent-only features (children, dashboard, notifications, PIN, Buddy AI,
 * admin) are NOT emulated: they still go to the inner service, which rejects
 * them without a session.
 */
import type { Child, ChildProgress, CompletionResult, ContentStore, Parent, ParentNotification } from "@/core/types";
import { ALL_TRACKS } from "@/core/types";
import { defaultContent } from "@/core/content";
import { completeActivity, dayKey, resolveActivity, type CompletionInput } from "@/core/engine";
import { checkAge, checkChildName, cleanText, LIMITS } from "@/core/validation";
import type { BuddyAnswer, ChildPatch, DataService, NewChildInput, Session } from "./service";
import { ServiceError } from "./service";

/** activeChildId used for the on-device guest learner. Never a real database id. */
export const GUEST_CHILD_ID = "guest";

export const isGuestSession = (s: Session | null | undefined) => !!s && !s.parent && s.activeChildId === GUEST_CHILD_ID;

const STORAGE_KEY = "kdl-guest-v1";
/** Don't keep a guest waiting on a slow or unreachable server for the curriculum. */
const CONTENT_TIMEOUT_MS = 4000;
const CONTENT_TTL_MS = 5 * 60 * 1000;

interface GuestRecord {
  version: 1;
  child: Child;
  progress: Omit<ChildProgress, "child">;
}

const clone = <T,>(x: T): T => structuredClone(x);

function uid(): string {
  try { return crypto.randomUUID(); } catch { return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
}

function readGuest(): GuestRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as GuestRecord;
    return rec.version === 1 && rec.child?.id === GUEST_CHILD_ID ? rec : null;
  } catch { return null; }
}

function writeGuest(rec: GuestRecord | null) {
  try {
    if (rec) localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable (private mode): progress lasts for this visit only */ }
}

export class GuestAwareService implements DataService {
  readonly mode: "mock" | "api";
  private listeners = new Set<() => void>();
  private loggedIn = false;
  private guest: GuestRecord | null | undefined;
  private content: { at: number; value: Promise<ContentStore> } | null = null;

  readonly resetDemo?: () => Promise<void>;

  constructor(private readonly inner: DataService) {
    this.mode = inner.mode;
    this.resetDemo = inner.resetDemo?.bind(inner);
    // Log in/out or an admin edit: the curriculum may differ, so drop the cached copy.
    inner.subscribe(() => { this.content = null; this.changed(); });
  }

  subscribe(l: () => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private changed() { this.listeners.forEach((l) => l()); }

  private record(): GuestRecord | null {
    if (this.guest === undefined) this.guest = typeof window === "undefined" ? null : readGuest();
    return this.guest;
  }
  private save(rec: GuestRecord | null) { this.guest = rec; writeGuest(rec); }

  private isGuestChild(childId: string) { return !this.loggedIn && childId === GUEST_CHILD_ID; }

  private requireGuest(): GuestRecord {
    const rec = this.record();
    if (!rec) throw new ServiceError("Pick your avatar and age to start learning.", 404);
    return rec;
  }

  // ------------------------------------------------------------ session

  async getSession(): Promise<Session> {
    const s = await this.inner.getSession();
    this.loggedIn = !!s.parent;
    if (s.parent) return s;
    return { parent: null, activeChildId: this.record() ? GUEST_CHILD_ID : null, mode: null };
  }

  signUp(input: { email: string; password: string; displayName: string }) { return this.inner.signUp(input); }
  logIn(input: { email: string; password: string }) { return this.inner.logIn(input); }
  logOut() { return this.inner.logOut(); }

  // ------------------------------------------------------------ learner profile

  listChildren(): Promise<Child[]> { return this.inner.listChildren(); }

  /** Logged out: creates (or replaces) the on-device guest learner. */
  async createChild(input: NewChildInput): Promise<Child> {
    if (this.loggedIn) return this.inner.createChild(input);
    const err = checkChildName(input.name) ?? checkAge(input.age);
    if (err) throw new ServiceError(err, 400);
    const child: Child = {
      id: GUEST_CHILD_ID, parentId: "", name: cleanText(input.name, LIMITS.nameMax), age: input.age, avatar: input.avatar || "🦁",
      createdAt: new Date().toISOString(),
      // No grown-up has set limits or switched Buddy on, so: no time limit, Buddy (AI) off.
      settings: { dailyGoal: 5, screenTimeMinutes: 0, allowedTracks: [...ALL_TRACKS], aiEnabled: false, soundOn: true, largeText: false },
    };
    this.save({ version: 1, child, progress: { completions: [], badges: [], streak: { current: 0, longest: 0, lastDay: null }, usage: {} } });
    this.changed();
    return clone(child);
  }

  /** Guests may change their own name, age and avatar (settings stay grown-up controlled). */
  async updateChild(id: string, patch: ChildPatch): Promise<Child> {
    if (!this.isGuestChild(id)) return this.inner.updateChild(id, patch);
    const rec = this.requireGuest();
    if (patch.name !== undefined) { const e = checkChildName(patch.name); if (e) throw new ServiceError(e, 400); rec.child.name = cleanText(patch.name, LIMITS.nameMax); }
    if (patch.age !== undefined) { const e = checkAge(patch.age); if (e) throw new ServiceError(e, 400); rec.child.age = patch.age; }
    if (patch.avatar !== undefined) rec.child.avatar = patch.avatar;
    this.save(rec);
    this.changed();
    return clone(rec.child);
  }

  async deleteChild(id: string): Promise<void> {
    if (!this.isGuestChild(id)) return this.inner.deleteChild(id);
    this.save(null);
    this.changed();
  }

  enterChildMode(childId: string) { return this.inner.enterChildMode(childId); }

  /** The parental gate calls this; a guest has no child-mode lock to leave. */
  async exitChildMode(pin?: string): Promise<void> {
    if (!this.loggedIn) return;
    return this.inner.exitChildMode(pin);
  }

  // ------------------------------------------------------------ learning

  /**
   * Logged out: the public curriculum endpoint, falling back to the built-in
   * curriculum (src/core/content) if the server is slow or unavailable, so
   * guest learning never depends on the database being up.
   */
  getContent(): Promise<ContentStore> {
    if (this.loggedIn) return this.inner.getContent();
    if (this.content && Date.now() - this.content.at < CONTENT_TTL_MS) return this.content.value.then(clone);
    const value = Promise.race([
      this.inner.getContent(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${CONTENT_TIMEOUT_MS} ms`)), CONTENT_TIMEOUT_MS)),
    ]).catch((e: unknown) => {
      console.warn("[guest] Curriculum service unavailable; using the built-in curriculum.", e);
      return defaultContent();
    });
    this.content = { at: Date.now(), value };
    return value.then(clone);
  }

  async getProgress(childId: string): Promise<ChildProgress> {
    if (!this.isGuestChild(childId)) return this.inner.getProgress(childId);
    const rec = this.requireGuest();
    return clone({ child: rec.child, ...rec.progress });
  }

  /** Same engine and rules as the server: the activity is rebuilt from its id and scored here. */
  async submitCompletion(childId: string, activityId: string, input: CompletionInput): Promise<CompletionResult> {
    if (!this.isGuestChild(childId)) return this.inner.submitCompletion(childId, activityId, input);
    const rec = this.requireGuest();
    const content = await this.getContent();
    const progress: ChildProgress = { child: rec.child, ...rec.progress };
    const activity = resolveActivity({ child: rec.child, history: rec.progress.completions, content }, activityId);
    if (!activity) throw new ServiceError("We couldn't find that activity.", 404);
    let out;
    try {
      out = completeActivity(progress, activity, input, { now: new Date(), today: dayKey(), badges: content.badges, newId: uid });
    } catch (e) {
      throw new ServiceError((e as Error).message, 400);
    }
    rec.progress = { completions: out.progress.completions, badges: out.progress.badges, streak: out.progress.streak, usage: rec.progress.usage };
    this.save(rec);
    this.changed();
    return clone(out.result);
  }

  async addUsage(childId: string, seconds: number): Promise<void> {
    if (!this.isGuestChild(childId)) return this.inner.addUsage(childId, seconds);
    const rec = this.record();
    if (!rec || seconds <= 0) return;
    const day = dayKey();
    rec.progress.usage[day] = (rec.progress.usage[day] ?? 0) + Math.min(120, seconds);
    this.save(rec); // no change event: avoids re-rendering on every tick
  }

  /** Buddy (AI) needs a grown-up's account and consent. */
  async askBuddy(childId: string, message: string): Promise<BuddyAnswer> {
    if (this.isGuestChild(childId)) throw new ServiceError("Buddy needs a grown-up to switch it on with a free parent account.", 403);
    return this.inner.askBuddy(childId, message);
  }

  // ------------------------------------------------------------ parent & admin (unchanged)

  listNotifications(): Promise<ParentNotification[]> { return this.inner.listNotifications(); }
  markNotificationsRead() { return this.inner.markNotificationsRead(); }
  updateParent(patch: { displayName?: string; notifications?: Partial<Parent["notifications"]> }) { return this.inner.updateParent(patch); }
  setPin(pin: string | null) { return this.inner.setPin(pin); }
  verifyPin(pin: string) { return this.inner.verifyPin(pin); }
  saveContent<K extends keyof ContentStore>(key: K, items: ContentStore[K]) { return this.inner.saveContent(key, items); }
}
