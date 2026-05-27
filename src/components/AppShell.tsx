"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isExport = pathname.startsWith("/export");

  if (isExport) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-4 py-6 pb-20 md:px-10 md:py-10 md:pb-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
