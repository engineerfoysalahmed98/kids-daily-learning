import type { Metadata } from "next";
import { RewardsScreen } from "@/screens/child/ExploreScreens";

export const metadata: Metadata = { title: "Rewards" };

export default function Page() {
  return <RewardsScreen />;
}
