import type { Metadata } from "next";
import { StoryScreen } from "@/screens/hub/ReadingScreens";

export const metadata: Metadata = { title: "গল্পের বই · Storybooks" };

export default function Page() {
  return <StoryScreen />;
}
