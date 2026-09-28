import type { Metadata } from "next";
import { ParentSettingsScreen } from "@/screens/parent/ManageScreens";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <ParentSettingsScreen />;
}
