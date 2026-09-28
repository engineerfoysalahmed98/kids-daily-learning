import type { Metadata } from "next";
import { LearnScreen } from "@/screens/child/LearnScreens";

export const metadata: Metadata = { title: "Learn" };

export default function Page() {
  return <LearnScreen />;
}
