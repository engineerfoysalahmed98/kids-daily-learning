"use client";
import { useState, type ReactNode } from "react";
import { AppProvider } from "@/state/AppProvider";
import { ApiDataService } from "@/state/apiService";
import { MockDataService } from "@/state/mockService";
import { NextNavProvider } from "@/nav/NextNav";

/**
 * NEXT_PUBLIC_DATA_MODE=mock  → everything runs in the browser (no database needed)
 * NEXT_PUBLIC_DATA_MODE=api   → PRODUCTION: API routes + PostgreSQL (default)
 */
export function Providers({ children }: { children: ReactNode }) {
  const [service] = useState(() => (process.env.NEXT_PUBLIC_DATA_MODE === "mock" ? new MockDataService() : new ApiDataService()));
  return (
    <AppProvider service={service}>
      <NextNavProvider>{children}</NextNavProvider>
    </AppProvider>
  );
}
