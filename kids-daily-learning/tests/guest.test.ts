import { describe, expect, it, vi } from "vitest";
import { defaultContent } from "../src/core/content";
import { buildDailyPlan, dayKey } from "../src/core/engine";
import type { Parent } from "../src/core/types";
import type { DataService, Session } from "../src/state/service";
import { ServiceError } from "../src/state/service";
import { GUEST_CHILD_ID, GuestAwareService, isGuestSession } from "../src/state/guestService";

const PARENT = { id: "p1", email: "p@example.test", displayName: "P", createdAt: "", role: "PARENT", hasPin: false, notifications: { activity: true, badge: true, goal: true } } as Parent;

/** Stand-in for the API service: logged out unless `session` says otherwise; parent-only calls reject like the API does. */
function innerService(session: Session = { parent: null, activeChildId: null, mode: null }) {
  const unauthorized = () => Promise.reject(new ServiceError("Please log in to continue.", 401));
  return {
    mode: "api" as const,
    getSession: vi.fn(async () => session),
    getContent: vi.fn(async () => defaultContent()),
    getProgress: vi.fn(unauthorized),
    submitCompletion: vi.fn(unauthorized),
    addUsage: vi.fn(unauthorized),
    askBuddy: vi.fn(unauthorized),
    createChild: vi.fn(unauthorized),
    listChildren: vi.fn(unauthorized),
    exitChildMode: vi.fn(unauthorized),
    subscribe: () => () => undefined,
  };
}
const asService = (inner: ReturnType<typeof innerService>) => inner as unknown as DataService;

describe("guest learning (no account)", () => {
  it("starts without a learner, then learns, scores and keeps progress on the device", async () => {
    const inner = innerService();
    const svc = new GuestAwareService(asService(inner));
    expect((await svc.getSession()).activeChildId).toBeNull();

    const child = await svc.createChild({ name: "Mim", age: 6, avatar: "🦊" });
    expect(child.id).toBe(GUEST_CHILD_ID);
    expect(child.settings.aiEnabled).toBe(false);
    const session = await svc.getSession();
    expect(isGuestSession(session)).toBe(true);

    const progress = await svc.getProgress(GUEST_CHILD_ID);
    const content = await svc.getContent();
    const plan = buildDailyPlan({ child: progress.child, history: [], content }, dayKey());
    const habit = plan.find((a) => a.kind === "habit" || a.kind === "creative");
    expect(habit).toBeDefined();
    await svc.submitCompletion(GUEST_CHILD_ID, habit!.id, { kind: "done", seconds: 60 });

    const after = await svc.getProgress(GUEST_CHILD_ID);
    expect(after.completions).toHaveLength(1);
    expect(after.completions[0].activityId).toBe(habit!.id);
    // Nothing guest-related was sent to the server.
    expect(inner.getProgress).not.toHaveBeenCalled();
    expect(inner.submitCompletion).not.toHaveBeenCalled();
    expect(inner.createChild).not.toHaveBeenCalled();
  });

  it("validates guest input with the same rules as the API", async () => {
    const svc = new GuestAwareService(asService(innerService()));
    await svc.getSession();
    await expect(svc.createChild({ name: "", age: 6, avatar: "🦊" })).rejects.toThrow();
    await expect(svc.createChild({ name: "Mim", age: 30, avatar: "🦊" })).rejects.toThrow();
  });

  it("rejects activity ids that don't exist", async () => {
    const svc = new GuestAwareService(asService(innerService()));
    await svc.getSession();
    await svc.createChild({ name: "Mim", age: 6, avatar: "🦊" });
    await expect(svc.submitCompletion(GUEST_CHILD_ID, "d.1999-01-01.nope", { kind: "done", seconds: 5 })).rejects.toThrow("couldn't find");
  });

  it("keeps Buddy (AI) and parent features locked for guests", async () => {
    const inner = innerService();
    const svc = new GuestAwareService(asService(inner));
    await svc.getSession();
    await svc.createChild({ name: "Mim", age: 6, avatar: "🦊" });
    await expect(svc.askBuddy(GUEST_CHILD_ID, "hi")).rejects.toMatchObject({ status: 403 });
    await expect(svc.listChildren()).rejects.toMatchObject({ status: 401 });
    // A real child id never resolves to guest data.
    await expect(svc.getProgress("some-real-child")).rejects.toMatchObject({ status: 401 });
  });

  it("uses the built-in curriculum when the curriculum service is unavailable", async () => {
    const inner = innerService();
    inner.getContent.mockRejectedValue(new ServiceError("We can't reach our database right now.", 503));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const svc = new GuestAwareService(asService(inner));
    await svc.getSession();
    const content = await svc.getContent();
    expect(content.stories.length).toBe(defaultContent().stories.length);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("logged-in parent", () => {
  it("passes every call straight through to the real service", async () => {
    const inner = innerService({ parent: PARENT, activeChildId: "c1", mode: "child" });
    inner.getProgress.mockResolvedValue({} as never);
    const svc = new GuestAwareService(asService(inner));
    const s = await svc.getSession();
    expect(s.parent?.id).toBe("p1");
    expect(isGuestSession(s)).toBe(false);
    await svc.getProgress("c1");
    expect(inner.getProgress).toHaveBeenCalledWith("c1");
    // Even the reserved guest id goes to the server (which rejects it) once logged in.
    await svc.getProgress(GUEST_CHILD_ID).catch(() => undefined);
    expect(inner.getProgress).toHaveBeenCalledWith(GUEST_CHILD_ID);
    // The parental gate still checks with the server.
    await svc.exitChildMode("1234").catch(() => undefined);
    expect(inner.exitChildMode).toHaveBeenCalledWith("1234");
  });
});
