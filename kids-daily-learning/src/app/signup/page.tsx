import type { Metadata } from "next";
import { SignUpScreen } from "@/screens/public/AuthScreens";

export const metadata: Metadata = { title: "Create account" };

export default function Page() {
  return <SignUpScreen />;
}
