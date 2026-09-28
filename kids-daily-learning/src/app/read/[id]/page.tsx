import type { Metadata } from "next";
import { ReadScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Story" };

export default function Page() {
  return <ReadScreen />;
}
