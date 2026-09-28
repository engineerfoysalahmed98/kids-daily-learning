import type { Metadata } from "next";
import { LoginScreen } from "@/screens/public/AuthScreens";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return <LoginScreen />;
}
