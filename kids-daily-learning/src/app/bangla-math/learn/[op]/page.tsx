import type { Metadata } from "next";
import { BnLessonScreen } from "@/screens/bangla/LessonScreen";

export const metadata: Metadata = { title: "গণিতের পাঠ" };

export default function Page() {
  return <BnLessonScreen />;
}
