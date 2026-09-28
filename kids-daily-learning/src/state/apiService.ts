/**
 * PRODUCTION DATA SERVICE — talks to the Next.js API routes in src/app/api.
 * Sessions live in an httpOnly cookie set by the server, so no tokens are
 * ever readable from JavaScript.
 */
import type { Child, ChildProgress, CompletionResult, ContentStore, Parent, ParentNotification } from "@/core/types";
import type { CompletionInput } from "@/core/engine";
import type { BuddyAnswer, ChildPatch, DataService, NewChildInput, Session } from "./service";
import { ServiceError } from "./service";

async function call<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(rest.headers ?? {}) },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    throw new ServiceError("You seem to be offline. Check your connection and try again.", 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ServiceError(body?.error ?? "Something went wrong. Please try again.", res.status, body?.field);
  return body as T;
}

export class ApiDataService implements DataService {
  readonly mode = "api" as const;
  private listeners = new Set<() => void>();
  private changed() { this.listeners.forEach((l) => l()); }
  subscribe(l: () => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }

  getSession() { return call<Session>("/api/auth/session"); }
  async signUp(input: { email: string; password: string; displayName: string }) { const p = await call<Parent>("/api/auth/signup", { method: "POST", json: input }); this.changed(); return p; }
  async logIn(input: { email: string; password: string }) { const p = await call<Parent>("/api/auth/login", { method: "POST", json: input }); this.changed(); return p; }
  async logOut() { await call("/api/auth/logout", { method: "POST" }); this.changed(); }

  listChildren() { return call<Child[]>("/api/children"); }
  async createChild(input: NewChildInput) { const c = await call<Child>("/api/children", { method: "POST", json: input }); this.changed(); return c; }
  async updateChild(id: string, patch: ChildPatch) { const c = await call<Child>(`/api/children/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }); this.changed(); return c; }
  async deleteChild(id: string) { await call(`/api/children/${encodeURIComponent(id)}`, { method: "DELETE" }); this.changed(); }
  async enterChildMode(childId: string) { await call("/api/auth/child-mode", { method: "POST", json: { childId } }); this.changed(); }
  async exitChildMode(pin?: string) { await call("/api/auth/child-mode", { method: "DELETE", json: { pin } }); this.changed(); }

  getContent() { return call<ContentStore>("/api/content"); }
  getProgress(childId: string) { return call<ChildProgress>(`/api/children/${encodeURIComponent(childId)}/progress`); }
  async submitCompletion(childId: string, activityId: string, input: CompletionInput) {
    const r = await call<CompletionResult>(`/api/children/${encodeURIComponent(childId)}/completions`, { method: "POST", json: { activityId, input } });
    this.changed();
    return r;
  }
  async addUsage(childId: string, seconds: number) { await call(`/api/children/${encodeURIComponent(childId)}/usage`, { method: "POST", json: { seconds } }); }
  askBuddy(childId: string, message: string) { return call<BuddyAnswer>("/api/buddy", { method: "POST", json: { childId, message } }); }

  listNotifications() { return call<ParentNotification[]>("/api/notifications"); }
  async markNotificationsRead() { await call("/api/notifications", { method: "PATCH" }); this.changed(); }
  async updateParent(patch: { displayName?: string; notifications?: Partial<Parent["notifications"]> }) { const p = await call<Parent>("/api/parent", { method: "PATCH", json: patch }); this.changed(); return p; }
  async setPin(pin: string | null) { await call("/api/parent/pin", { method: "PUT", json: { pin } }); this.changed(); }
  async verifyPin(pin: string) { return (await call<{ ok: boolean }>("/api/parent/pin", { method: "POST", json: { pin } })).ok; }

  async saveContent<K extends keyof ContentStore>(key: K, items: ContentStore[K]) {
    await call(`/api/admin/content/${key}`, { method: "PUT", json: items });
    this.changed();
  }
}
