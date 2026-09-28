import type { Metadata } from "next";
import { LessonScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Lesson" };

export default function Page() {
  return <LessonScreen />;
}
