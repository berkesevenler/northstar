"use client";

import Link from "next/link";
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
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/targets", label: "Targets", icon: TargetIcon },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white md:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium",
              active ? "text-brand-600" : "text-slate-500",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
