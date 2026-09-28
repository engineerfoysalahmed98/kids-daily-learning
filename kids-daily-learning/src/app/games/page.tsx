import type { Metadata } from "next";
import { GamesScreen } from "@/screens/child/ExploreScreens";

export const metadata: Metadata = { title: "Games" };

export default function Page() {
  return <GamesScreen />;
}
