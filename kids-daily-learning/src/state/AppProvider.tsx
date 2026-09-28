"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DataService, Session } from "./service";
import type { CompletionResult } from "@/core/types";

interface AppContextValue {
  service: DataService;
  session: Session | null;
  refreshSession: () => Promise<void>;
  /** bumps whenever the service reports a change */
  version: number;
  /** last completion results, keyed by activity id (for the completion screen) */
  results: Map<string, CompletionResult>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ service, children }: { service: DataService; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [version, setVersion] = useState(0);
  const results = useRef(new Map<string, CompletionResult>()).current;

  const refreshSession = useCallback(async () => {
    try { setSession(await service.getSession()); }
    catch { setSession({ parent: null, activeChildId: null, mode: null }); }
  }, [service]);

  useEffect(() => {
    void refreshSession();
    return service.subscribe(() => { setVersion((v) => v + 1); void refreshSession(); });
  }, [service, refreshSession]);

  const value = useMemo(() => ({ service, session, refreshSession, version, results }), [service, session, refreshSession, version, results]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export interface LoadState<T> { data: T | undefined; error: Error | null; loading: boolean; reload: () => void; }

/** Last-known values so screens render instantly on revisit (then refresh). */
const cache = new Map<string, unknown>();

/** Loads data from the service and reloads after any write. */
export function useLoad<T>(fn: (s: DataService) => Promise<T>, deps: unknown[] = [], cacheKey?: string): LoadState<T> {
  const { service, version } = useApp();
  const [state, setState] = useState<{ data: T | undefined; error: Error | null; loading: boolean }>(() => ({ data: cacheKey ? (cache.get(cacheKey) as T | undefined) : undefined, error: null, loading: true }));
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn(service).then(
      (data) => { if (cacheKey) cache.set(cacheKey, data); if (alive) setState({ data, error: null, loading: false }); },
      (error: Error) => { if (alive) setState((s) => ({ data: s.data, error, loading: false })); },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, version, nonce, ...deps]);
  return { ...state, reload: () => setNonce((n) => n + 1) };
}
