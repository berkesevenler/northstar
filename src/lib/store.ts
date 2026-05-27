"use client";

import { create } from "zustand";
import type {
  Customer,
  Project,
  RevenueEntry,
  Target,
} from "./types";

interface TrackerState {
  projects: Project[];
  customers: Customer[];
  revenue: RevenueEntry[];
  targets: Target[];

  loading: boolean;
  saving: boolean;
  error: string | null;
  loaded: boolean;

  load: () => Promise<void>;

  addProject: (p: Omit<Project, "id" | "createdAt">) => Promise<void>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addRevenue: (r: Omit<RevenueEntry, "id" | "createdAt">) => Promise<void>;
  updateRevenue: (id: string, r: Partial<RevenueEntry>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;

  addTarget: (t: Omit<Target, "id" | "createdAt">) => Promise<void>;
  updateTarget: (id: string, t: Partial<Target>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;

  resetAll: () => Promise<void>;
  seedDemo: () => Promise<void>;
  clearError: () => void;
}

type EntityKey = "projects" | "customers" | "revenue" | "targets";
type EntityType = Project | Customer | RevenueEntry | Target;

async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const useTracker = create<TrackerState>((set, get) => {
  async function withSaving<R>(fn: () => Promise<R>): Promise<R> {
    set({ saving: true, error: null });
    try {
      const r = await fn();
      set({ saving: false });
      return r;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      set({ saving: false, error: msg });
      throw err;
    }
  }

  function makeAdd<K extends EntityKey, T extends EntityType>(
    key: K,
    endpoint: string,
  ) {
    return async (body: Omit<T, "id" | "createdAt">) => {
      await withSaving(async () => {
        const { item } = await api<{ item: T }>(endpoint, {
          method: "POST",
          body: JSON.stringify(body),
        });
        set((s) => ({ [key]: [...(s[key] as T[]), item] }) as Partial<TrackerState>);
      });
    };
  }

  function makeUpdate<K extends EntityKey, T extends EntityType>(
    key: K,
    endpoint: string,
  ) {
    return async (id: string, patch: Partial<T>) => {
      await withSaving(async () => {
        const { item } = await api<{ item: T }>(`${endpoint}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        set(
          (s) =>
            ({
              [key]: (s[key] as T[]).map((x) => (x.id === id ? item : x)),
            }) as Partial<TrackerState>,
        );
      });
    };
  }

  function makeDelete<K extends EntityKey, T extends EntityType>(
    key: K,
    endpoint: string,
  ) {
    return async (id: string) => {
      await withSaving(async () => {
        await api<{ ok: true }>(`${endpoint}/${id}`, { method: "DELETE" });
        set(
          (s) =>
            ({
              [key]: (s[key] as T[]).filter((x) => x.id !== id),
            }) as Partial<TrackerState>,
        );
      });
    };
  }

  return {
    projects: [],
    customers: [],
    revenue: [],
    targets: [],

    loading: false,
    saving: false,
    error: null,
    loaded: false,

    load: async () => {
      if (get().loading) return;
      set({ loading: true, error: null });
      try {
        const data = await api<{
          projects: Project[];
          customers: Customer[];
          revenue: RevenueEntry[];
          targets: Target[];
        }>("/api/data");
        set({
          projects: data.projects,
          customers: data.customers,
          revenue: data.revenue,
          targets: data.targets,
          loading: false,
          loaded: true,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load data.";
        set({ loading: false, loaded: true, error: msg });
      }
    },

    addProject: makeAdd<"projects", Project>("projects", "/api/projects"),
    updateProject: makeUpdate<"projects", Project>("projects", "/api/projects"),
    deleteProject: makeDelete<"projects", Project>("projects", "/api/projects"),

    addCustomer: makeAdd<"customers", Customer>("customers", "/api/customers"),
    updateCustomer: makeUpdate<"customers", Customer>(
      "customers",
      "/api/customers",
    ),
    deleteCustomer: makeDelete<"customers", Customer>(
      "customers",
      "/api/customers",
    ),

    addRevenue: makeAdd<"revenue", RevenueEntry>("revenue", "/api/revenue"),
    updateRevenue: makeUpdate<"revenue", RevenueEntry>(
      "revenue",
      "/api/revenue",
    ),
    deleteRevenue: makeDelete<"revenue", RevenueEntry>(
      "revenue",
      "/api/revenue",
    ),

    addTarget: makeAdd<"targets", Target>("targets", "/api/targets"),
    updateTarget: makeUpdate<"targets", Target>("targets", "/api/targets"),
    deleteTarget: makeDelete<"targets", Target>("targets", "/api/targets"),

    resetAll: async () => {
      await withSaving(async () => {
        await api<{ ok: true }>("/api/reset", { method: "POST" });
        set({ projects: [], customers: [], revenue: [], targets: [] });
      });
    },

    seedDemo: async () => {
      await withSaving(async () => {
        await api<{ ok: true }>("/api/seed", { method: "POST" });
        const data = await api<{
          projects: Project[];
          customers: Customer[];
          revenue: RevenueEntry[];
          targets: Target[];
        }>("/api/data");
        set({
          projects: data.projects,
          customers: data.customers,
          revenue: data.revenue,
          targets: data.targets,
        });
      });
    },

    clearError: () => set({ error: null }),
  };
});
