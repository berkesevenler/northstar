"use client";

import { useEffect, useState } from "react";
import { useTracker } from "@/lib/store";
import { Loader2, AlertCircle } from "lucide-react";

export default function HydrationGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { load, loaded, loading, error, clearError } = useTracker();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loaded && !loading) {
      load();
    }
  }, [mounted, loaded, loading, load]);

  if (!mounted || (!loaded && loading)) {
    return (
      fallback ?? (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading from Google Sheets…
        </div>
      )
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">Something went wrong.</div>
              <div className="text-red-600/90">{error}</div>
            </div>
          </div>
          <button
            onClick={clearError}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </>
  );
}
