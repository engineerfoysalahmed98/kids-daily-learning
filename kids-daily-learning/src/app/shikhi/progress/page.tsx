import type { Metadata } from "next";
import { HubProgressScreen } from "@/screens/hub/HubScreens";

export const metadata: Metadata = { title: "আমার অগ্রগতি · My progress" };

export default function Page() {
  return <HubProgressScreen />;
}
