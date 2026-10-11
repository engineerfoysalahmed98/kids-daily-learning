import type { Metadata } from "next";
import { MathFolderScreen } from "@/screens/hub/HubScreens";

export const metadata: Metadata = { title: "বাংলা গণিত" };

export default function Page() {
  return <MathFolderScreen />;
}
