/**
 * Playable demo entry — the same screens as the Next.js app, mounted with a
 * hash router and the in-browser MockDataService. Built into one
 * self-contained HTML file by scripts/build-demo.mjs.
 */
import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AppProvider } from "@/state/AppProvider";
import { MockDataService } from "@/state/mockService";
import { NavProvider, matchRoute, ROUTES, type LinkProps, type Nav } from "@/nav/nav";
import { LandingScreen } from "@/screens/public/LandingScreen";
import { LoginScreen, SignUpScreen } from "@/screens/public/AuthScreens";
import { SafetyScreen } from "@/screens/public/SafetyScreen";
import { ProfilesScreen } from "@/screens/public/ProfilesScreen";
import { HomeScreen } from "@/screens/child/HomeScreen";
import { LearnScreen, SubjectScreen } from "@/screens/child/LearnScreens";
import { CreateScreen, HabitScreen, LessonScreen, MemoryScreen, QuizScreen, ReadScreen } from "@/screens/child/ActivityScreens";
import { CompleteScreen } from "@/screens/child/CompleteScreen";
import { BadgesScreen, GamesScreen, RewardsScreen, StoriesScreen } from "@/screens/child/ExploreScreens";
import { BuddyScreen, MeScreen } from "@/screens/child/ProfileBuddyScreens";
import { ParentDashboardScreen } from "@/screens/parent/DashboardScreen";
import { ProgressScreen } from "@/screens/parent/ProgressScreen";
import { ChildrenScreen, ParentSettingsScreen } from "@/screens/parent/ManageScreens";
import { AdminScreen } from "@/screens/admin/AdminScreen";

const TABLE: [string, ComponentType][] = [
  [ROUTES.landing, LandingScreen], [ROUTES.signup, SignUpScreen], [ROUTES.login, LoginScreen], [ROUTES.safety, SafetyScreen],
  [ROUTES.profiles, ProfilesScreen], [ROUTES.home, HomeScreen], [ROUTES.learn, LearnScreen], [ROUTES.subject, SubjectScreen],
  [ROUTES.lesson, LessonScreen], [ROUTES.quiz, QuizScreen], [ROUTES.read, ReadScreen], [ROUTES.create, CreateScreen],
  [ROUTES.habit, HabitScreen], [ROUTES.memory, MemoryScreen], [ROUTES.complete, CompleteScreen], [ROUTES.games, GamesScreen],
  [ROUTES.stories, StoriesScreen], [ROUTES.rewards, RewardsScreen], [ROUTES.badges, BadgesScreen], [ROUTES.me, MeScreen],
  [ROUTES.buddy, BuddyScreen], [ROUTES.parent, ParentDashboardScreen], [ROUTES.parentChildren, ChildrenScreen],
  [ROUTES.parentProgress, ProgressScreen], [ROUTES.parentSettings, ParentSettingsScreen], [ROUTES.admin, AdminScreen],
];

/*
 * The artifact viewer only passes plain "#token" anchors, so routes live in
 * memory; the hash mirrors them for back/forward inside the page.
 */
function useMemoryHistory() {
  const [stack, setStack] = useState<string[]>(["/"]);
  const path = stack[stack.length - 1];
  useEffect(() => { window.scrollTo({ top: 0 }); }, [path]);
  return {
    path,
    push: (p: string) => setStack((s) => [...s, p]),
    replace: (p: string) => setStack((s) => [...s.slice(0, -1), p]),
    back: (fallback: string) => setStack((s) => (s.length > 1 ? s.slice(0, -1) : [fallback])),
  };
}

function App({ service }: { service: MockDataService }) {
  const h = useMemoryHistory();
  const clean = h.path.split("?")[0];
  let Screen: ComponentType = NotFoundScreen;
  let params: Record<string, string> = {};
  for (const [pattern, C] of TABLE) {
    const m = matchRoute(pattern, clean);
    if (m) { Screen = C; params = m; break; }
  }

  const nav: Nav = useMemo(() => {
    const go = (to: string, opts?: { replace?: boolean }) => (opts?.replace ? h.replace(to) : h.push(to));
    const DemoLink = ({ to, children, onClick, ...rest }: LinkProps) => (
      <a href={`#${to.replace(/[^\w.~-]/g, "") || "home"}`} {...rest}
        onClick={(e) => { onClick?.(e); if (e.defaultPrevented || e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); }}>{children}</a>
    );
    return { path: clean, params, go, back: (fb = "/home") => h.back(fb), Link: DemoLink };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h.path]);

  return (
    <NavProvider nav={nav}>
      <Screen key={h.path} />
    </NavProvider>
  );
}

function NotFoundScreen() {
  return <div className="grid min-h-dvh place-items-center bg-bg p-6 text-center"><div><p className="text-5xl">🧭</p><h1 className="text-2xl">Page not found</h1><a href="#home" className="btn-primary mt-4" onClick={(e) => { e.preventDefault(); location.reload(); }}>Start over</a></div></div>;
}

const service = new MockDataService();
createRoot(document.getElementById("root")!).render(
  <AppProvider service={service}>
    <App service={service} />
  </AppProvider>,
);
