import type { Metadata } from "next";
import { ParentDashboardScreen } from "@/screens/parent/DashboardScreen";

export const metadata: Metadata = { title: "Parent Dashboard" };

export default function Page() {
  return <ParentDashboardScreen />;
}
