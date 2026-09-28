import type { Metadata } from "next";
import { BuddyScreen } from "@/screens/child/ProfileBuddyScreens";

export const metadata: Metadata = { title: "Buddy" };

export default function Page() {
  return <BuddyScreen />;
}
