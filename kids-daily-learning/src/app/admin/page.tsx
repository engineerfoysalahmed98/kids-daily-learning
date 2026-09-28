import type { Metadata } from "next";
import { AdminScreen } from "@/screens/admin/AdminScreen";

export const metadata: Metadata = { title: "Content Admin" };

export default function Page() {
  return <AdminScreen />;
}
