import type { Appointment, AppointmentStatus, AppointmentPriority } from "@/types";

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 – 20:00
export const HOUR_HEIGHT = 60;
export const DAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const MONTHS_DE = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
];

export const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  completed: "Abgeschlossen",
  postponed: "Verschoben",
  scheduled: "Geplant",
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};

export const PRIO_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "#4c6ef5",
  in_progress: "#f59f00",
  completed: "#40c057",
  postponed: "#868e96",
  scheduled: "#4c6ef5",
  confirmed: "#3b82f6",
  cancelled: "#ef4444",
  no_show: "#ef4444",
};

export const PRIO_COLORS: Record<string, string> = {
  low: "#51cf66",
  medium: "#fab005",
  high: "#ff6b6b",
};

export function formatDateDE(d: Date): string {
  return d.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);
  const days: Date[] = [];
  const current = new Date(start);
  while (days.length < 42) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
    if (days.length >= 35 && current.getMonth() !== month) break;
  }
  return days;
}

export function getViewRange(date: Date, view: string): { start: Date; end: Date } {
  if (view === "day") {
    const s = new Date(date); s.setHours(0, 0, 0, 0);
    const e = new Date(date); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (view === "week") {
    const ws = getWeekStart(date);
    const we = new Date(ws); we.setDate(we.getDate() + 6); we.setHours(23, 59, 59, 999);
    return { start: ws, end: we };
  }
  if (view === "timeline") {
    const s = new Date(date); s.setHours(0, 0, 0, 0);
    const e = new Date(date); e.setDate(e.getDate() + 2); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  // month + list: wide range
  const days = getMonthDays(date);
  const s = new Date(days[0]); s.setHours(0, 0, 0, 0);
  const e = new Date(days[days.length - 1]); e.setHours(23, 59, 59, 999);
  return { start: s, end: e };
}

export function getAppointmentColor(apt: Appointment): string {
  if (apt.color) return apt.color;
  return STATUS_COLORS[apt.status] || "#4c6ef5";
}

export function getTimePos(apt: Appointment) {
  const s = new Date(apt.start_time);
  const e = new Date(apt.end_time);
  const sh = s.getHours() + s.getMinutes() / 60;
  const eh = e.getHours() + e.getMinutes() / 60;
  return { top: (sh - 7) * HOUR_HEIGHT, height: Math.max((eh - sh) * HOUR_HEIGHT, 24) };
}
