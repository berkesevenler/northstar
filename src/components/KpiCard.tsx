import React from "react";
import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}

const accents: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  indigo: "from-indigo-500 to-indigo-700",
  emerald: "from-emerald-500 to-emerald-700",
  amber: "from-amber-500 to-amber-700",
  rose: "from-rose-500 to-rose-700",
  sky: "from-sky-500 to-sky-700",
};

export default function KpiCard({
  label,
  value,
  icon,
  hint,
  accent = "indigo",
}: KpiCardProps) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
      </div>
      {icon && (
        <div
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow",
            accents[accent],
          )}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
