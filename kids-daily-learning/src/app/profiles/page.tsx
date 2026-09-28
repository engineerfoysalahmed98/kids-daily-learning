import type { Metadata } from "next";
import { ProfilesScreen } from "@/screens/public/ProfilesScreen";

export const metadata: Metadata = { title: "Who's learning?" };

export default function Page() {
  return <ProfilesScreen />;
}
