"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  DollarSign,
  Target as TargetIcon,
  Calendar,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/targets", label: "Targets", icon: TargetIcon },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
        <Image
          src="/logo.png"
          alt="Northstar"
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />
        <div>
          <div className="text-sm font-semibold leading-tight">Northstar</div>
          <div className="text-xs text-slate-500">Success Tracker</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        Synced with Google Sheets.
      </div>
    </aside>
  );
}
