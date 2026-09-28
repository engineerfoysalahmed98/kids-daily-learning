import type { Metadata } from "next";
import { ProgressScreen } from "@/screens/parent/ProgressScreen";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return <ProgressScreen />;
}
