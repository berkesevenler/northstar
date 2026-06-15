"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  LayoutGrid,
  Clock,
  MapPin,
  Users,
  FileText,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import HydrationGate from "@/components/HydrationGate";
import { useTracker } from "@/lib/store";
import type { CalendarEvent } from "@/lib/types";

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(d: Date) {
  return toISO(d) === toISO(new Date());
}

function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** 42-cell grid for a month, starting Monday */
function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Monday-based offset: Sun=6, Mon=0, Tue=1 …
  const startPad = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = startPad - 1; i >= 0; i--)
    days.push(new Date(year, month, -i));
  for (let d = 1; d <= last.getDate(); d++)
    days.push(new Date(year, month, d));
  while (days.length < 42)
    days.push(new Date(year, month + 1, days.length - last.getDate() - startPad + 1));
  return days;
}

/** 7 days Mon→Sun containing `date` */
function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + i),
  );
}

function sortByTime(evs: CalendarEvent[]) {
  return [...evs].sort((a, b) =>
    (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"),
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Event colour palette (cycles by id hash) ────────────────────────────────

const PALETTES = [
  { bg: "bg-brand-100", text: "text-brand-800", border: "border-brand-200", dot: "bg-brand-500" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", dot: "bg-amber-500" },
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200", dot: "bg-rose-500" },
  { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200", dot: "bg-sky-500" },
];

function palette(id: string) {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  attendees: string;
}

const emptyForm = (date?: string): FormState => ({
  title: "",
  date: date ?? toISO(new Date()),
  startTime: "",
  endTime: "",
  description: "",
  location: "",
  attendees: "",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  return (
    <HydrationGate fallback={<div className="py-10 text-sm text-slate-400">Loading…</div>}>
      <Calendar />
    </HydrationGate>
  );
}

function Calendar() {
  const { events, addEvent, updateEvent, deleteEvent, saving } = useTracker();

  const [view, setView] = useState<"month" | "week">("month");
  const [navDate, setNavDate] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // group events by ISO date
  const byDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  // ── Navigation ──

  function goToday() { setNavDate(new Date()); }

  function goBack() {
    if (view === "month") {
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1));
    } else {
      const d = new Date(navDate);
      d.setDate(d.getDate() - 7);
      setNavDate(d);
    }
  }

  function goForward() {
    if (view === "month") {
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1));
    } else {
      const d = new Date(navDate);
      d.setDate(d.getDate() + 7);
      setNavDate(d);
    }
  }

  // ── Form ──

  function openNew(date?: string) {
    setForm(emptyForm(date));
    setFormOpen(true);
  }

  function openEdit(e: CalendarEvent) {
    setDetailEvent(null);
    setForm({
      id: e.id,
      title: e.title,
      date: e.date,
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      description: e.description ?? "",
      location: e.location ?? "",
      attendees: e.attendees ?? "",
    });
    setFormOpen(true);
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      attendees: form.attendees.trim() || undefined,
    };
    try {
      if (form.id) {
        await updateEvent(form.id, payload);
      } else {
        await addEvent(payload);
      }
      setFormOpen(false);
    } catch { /* error banner handles it */ }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setDetailEvent(null);
  }

  // ── Range label ──

  const rangeLabel = useMemo(() => {
    if (view === "month") {
      return navDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    const week = getWeekDays(navDate);
    const s = week[0]; const e = week[6];
    if (s.getMonth() === e.getMonth())
      return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
    return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [view, navDate]);

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Shared meetings and events for the team."
        actions={
          <button onClick={() => openNew()} className="btn-primary">
            <Plus className="h-4 w-4" /> New event
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="btn-secondary !min-w-0 px-2 py-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToday} className="btn-secondary text-xs">Today</button>
          <button onClick={goForward} className="btn-secondary !min-w-0 px-2 py-2">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-slate-800">{rangeLabel}</span>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-300 bg-white overflow-hidden">
          <button
            onClick={() => setView("month")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition",
              view === "month"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Month
          </button>
          <button
            onClick={() => setView("week")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition border-l border-slate-300",
              view === "week"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Week
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          navDate={navDate}
          byDate={byDate}
          onDayClick={(date) => openNew(date)}
          onEventClick={setDetailEvent}
        />
      ) : (
        <WeekView
          navDate={navDate}
          byDate={byDate}
          onDayClick={(date) => openNew(date)}
          onEventClick={setDetailEvent}
        />
      )}

      {/* ── Event Detail Modal ── */}
      {detailEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDetailEvent(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* colour strip */}
            <div className={clsx("h-1.5", palette(detailEvent.id).dot.replace("bg-", "bg-"))} />
            <div className="px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {new Date(detailEvent.date + "T12:00:00").toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </div>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900 leading-snug">
                    {detailEvent.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailEvent(null)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {(detailEvent.startTime || detailEvent.endTime) && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    {detailEvent.startTime}
                    {detailEvent.endTime && ` – ${detailEvent.endTime}`}
                  </div>
                )}
                {detailEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    {detailEvent.location}
                  </div>
                )}
                {detailEvent.attendees && (
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <Users className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                    <span>{detailEvent.attendees}</span>
                  </div>
                )}
                {detailEvent.description && (
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                    <span className="whitespace-pre-wrap">{detailEvent.description}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => openEdit(detailEvent)}
                  className="btn-secondary flex-1"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(detailEvent.id)}
                  className="btn-secondary flex-1 !text-red-600 hover:!bg-red-50 hover:!border-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Form Modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? "Edit event" : "New event"}
        footer={
          <>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button form="event-form" type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : form.id ? "Save changes" : "Add event"}
            </button>
          </>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              autoFocus
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Investor call"
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End time</label>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Office, Zoom link, address…"
            />
          </div>
          <div>
            <label className="label">Attendees</label>
            <input
              className="input"
              value={form.attendees}
              onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              placeholder="Berke, Co-founder, jane@example.com"
            />
          </div>
          <div>
            <label className="label">Description / Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Agenda, prep notes…"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  navDate,
  byDate,
  onDayClick,
  onEventClick,
}: {
  navDate: Date;
  byDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const days = useMemo(
    () => getMonthGrid(navDate.getFullYear(), navDate.getMonth()),
    [navDate],
  );

  return (
    <div className="card overflow-hidden p-0">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map((day, idx) => {
          const iso = toISO(day);
          const dayEvents = sortByTime(byDate[iso] ?? []);
          const outsideMonth = !isSameMonth(day, navDate);
          const today = isToday(day);

          return (
            <div
              key={idx}
              className={clsx(
                "min-h-[100px] p-1.5 flex flex-col gap-0.5 cursor-pointer group",
                outsideMonth ? "bg-slate-50" : "bg-white hover:bg-slate-50/60",
              )}
              onClick={() => onDayClick(iso)}
            >
              {/* Day number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    today
                      ? "bg-brand-600 text-white font-bold"
                      : outsideMonth
                      ? "text-slate-400"
                      : "text-slate-700 group-hover:text-slate-900",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events */}
              {dayEvents.slice(0, 3).map((e) => {
                const p = palette(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className={clsx(
                      "w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-snug transition hover:opacity-80",
                      p.bg, p.text,
                    )}
                  >
                    {e.startTime && (
                      <span className="opacity-70 mr-0.5">{e.startTime}</span>
                    )}
                    {e.title}
                  </button>
                );
              })}
              {dayEvents.length > 3 && (
                <span className="text-[11px] text-slate-500 pl-1.5">
                  +{dayEvents.length - 3} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  navDate,
  byDate,
  onDayClick,
  onEventClick,
}: {
  navDate: Date;
  byDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: string) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const week = useMemo(() => getWeekDays(navDate), [navDate]);

  return (
    <div className="card overflow-hidden p-0">
      <div className="grid grid-cols-7 divide-x divide-slate-200">
        {week.map((day) => {
          const iso = toISO(day);
          const dayEvents = sortByTime(byDate[iso] ?? []);
          const today = isToday(day);

          return (
            <div key={iso} className="flex flex-col">
              {/* Day header */}
              <div
                className={clsx(
                  "flex flex-col items-center py-3 border-b cursor-pointer select-none",
                  today ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                )}
                onClick={() => onDayClick(iso)}
              >
                <span className={clsx("text-[11px] font-semibold uppercase tracking-wide",
                  today ? "text-brand-600" : "text-slate-500",
                )}>
                  {day.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span
                  className={clsx(
                    "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    today ? "bg-brand-600 text-white" : "text-slate-800",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events column */}
              <div
                className={clsx(
                  "flex-1 space-y-1.5 p-2 min-h-[200px] cursor-pointer",
                  today ? "bg-brand-50/40" : "bg-white hover:bg-slate-50/60",
                )}
                onClick={() => onDayClick(iso)}
              >
                {dayEvents.map((e) => {
                  const p = palette(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className={clsx(
                        "w-full rounded-lg border p-2 text-left text-xs transition hover:opacity-80",
                        p.bg, p.border,
                      )}
                    >
                      <div className={clsx("font-semibold truncate", p.text)}>
                        {e.title}
                      </div>
                      {(e.startTime || e.endTime) && (
                        <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          {e.startTime}{e.endTime ? ` – ${e.endTime}` : ""}
                        </div>
                      )}
                      {e.location && (
                        <div className="mt-0.5 flex items-center gap-1 text-slate-500 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {e.location}
                        </div>
                      )}
                    </button>
                  );
                })}
                {dayEvents.length === 0 && (
                  <div className="py-2 text-center text-[11px] text-slate-400 opacity-0 group-hover:opacity-100">
                    + Add
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
