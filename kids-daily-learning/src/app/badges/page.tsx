import type { Metadata } from "next";
import { BadgesScreen } from "@/screens/child/ExploreScreens";

export const metadata: Metadata = { title: "Badges" };

export default function Page() {
  return <BadgesScreen />;
}
