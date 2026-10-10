import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "../components";
export const metadata: Metadata = { title: "Rainmakers Workspace", description: "A private, member-owned learning and execution workspace. Unofficial community tool.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Shell>{children}</Shell></body></html>;
}
