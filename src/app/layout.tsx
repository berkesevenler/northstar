import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Northstar — Startup Metrics Tracker",
  description:
    "Track projects, customers, MRR, ARR and targets. Self-hosted, no-login, backed by Google Sheets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-4 py-6 pb-20 md:px-10 md:py-10 md:pb-10">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
