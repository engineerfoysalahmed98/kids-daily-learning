import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Fredoka({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Nunito({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Kids Daily Learning — Learn. Play. Grow. Every Day.", template: "%s · Kids Daily Learning" },
  description: "Fun daily activities that help children aged 4–12 build knowledge, creativity and healthy habits.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F2F6FF" }, { media: "(prefers-color-scheme: dark)", color: "#111730" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
