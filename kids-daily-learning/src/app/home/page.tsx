import type { Metadata } from "next";
import { HomeScreen } from "@/screens/child/HomeScreen";

export const metadata: Metadata = { title: "Today's Adventure" };

export default function Page() {
  return <HomeScreen />;
}
