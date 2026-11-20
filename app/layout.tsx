import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Français | Grade 7 French",
  description: "Short listening, vocabulary, verb, and speaking practice for Grade 7 Core French.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
