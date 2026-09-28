import type { Metadata } from "next";
import { MemoryScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Memory Match" };

export default function Page() {
  return <MemoryScreen />;
}
