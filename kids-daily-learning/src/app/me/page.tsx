import type { Metadata } from "next";
import { MeScreen } from "@/screens/child/ProfileBuddyScreens";

export const metadata: Metadata = { title: "My Profile" };

export default function Page() {
  return <MeScreen />;
}
