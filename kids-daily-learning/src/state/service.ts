import type {
  Child, ChildProgress, ChildSettings, CompletionResult, ContentStore, NotificationPrefs, Parent, ParentNotification,
} from "@/core/types";
import type { CompletionInput } from "@/core/engine";
import type { BuddyReply } from "@/core/buddy/mockBuddy";

export interface Session {
  parent: Parent | null;
  /** Child currently using the device (child mode). */
  activeChildId: string | null;
  /** "child" = locked into the kid experience; parent pages need the parent gate. */
  mode: "parent" | "child" | null;
}

export interface NewChildInput { name: string; age: number; avatar: string; }
export interface ChildPatch { name?: string; age?: number; avatar?: string; settings?: Partial<ChildSettings>; }

export interface BuddyAnswer extends BuddyReply { blocked?: boolean; remaining?: number; }

/**
 * The one boundary between UI and data. Screens only talk to this interface.
 *
 *  - MockDataService  (src/state/mockService.ts)  in-browser demo data
 *  - ApiDataService   (src/state/apiService.ts)   PRODUCTION: calls /api/* routes,
 *                                                  which use Prisma + PostgreSQL
 *
 * Select with NEXT_PUBLIC_DATA_MODE=mock|api.
 */
export interface DataService {
  readonly mode: "mock" | "api";

  getSession(): Promise<Session>;
  signUp(input: { email: string; password: string; displayName: string }): Promise<Parent>;
  logIn(input: { email: string; password: string }): Promise<Parent>;
  logOut(): Promise<void>;

  listChildren(): Promise<Child[]>;
  createChild(input: NewChildInput): Promise<Child>;
  updateChild(id: string, patch: ChildPatch): Promise<Child>;
  deleteChild(id: string): Promise<void>;
  enterChildMode(childId: string): Promise<void>;
  /** Leave child mode. Requires the parent PIN when one is set. */
  exitChildMode(pin?: string): Promise<void>;

  getContent(): Promise<ContentStore>;
  getProgress(childId: string): Promise<ChildProgress>;
  submitCompletion(childId: string, activityId: string, input: CompletionInput): Promise<CompletionResult>;
  /** Screen-time tracking; negative values grant extra time (parent only). */
  addUsage(childId: string, seconds: number): Promise<void>;
  askBuddy(childId: string, message: string): Promise<BuddyAnswer>;

  listNotifications(): Promise<ParentNotification[]>;
  markNotificationsRead(): Promise<void>;
  updateParent(patch: { displayName?: string; notifications?: Partial<NotificationPrefs> }): Promise<Parent>;
  setPin(pin: string | null): Promise<void>;
  verifyPin(pin: string): Promise<boolean>;

  saveContent<K extends keyof ContentStore>(key: K, items: ContentStore[K]): Promise<void>;
  resetDemo?(): Promise<void>;

  /** Called after any write so screens can refresh. */
  subscribe(listener: () => void): () => void;
}

export class ServiceError extends Error {
  constructor(message: string, public readonly status = 400, public readonly field?: string) {
    super(message);
  }
}
