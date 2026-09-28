import type { Metadata } from "next";
import { HabitScreen } from "@/screens/child/ActivityScreens";

export const metadata: Metadata = { title: "Good Habit" };

export default function Page() {
  return <HabitScreen />;
}
