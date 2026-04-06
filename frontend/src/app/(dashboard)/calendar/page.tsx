"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { calendarAPI, crmAPI } from "@/services/api";
import type { Appointment, CalendarView, Customer, Vehicle, Location, ContactPerson } from "@/types";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Search } from "lucide-react";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00
const HOUR_HEIGHT = 60;
const DAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
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

function getViewRange(date: Date, view: CalendarView): { start: Date; end: Date } {
  if (view === "day") {
    const s = new Date(date);
    s.setHours(0, 0, 0, 0);
    const e = new Date(date);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }
  if (view === "week") {
    const ws = getWeekStart(date);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    we.setHours(23, 59, 59, 999);
    return { start: ws, end: we };
  }
  // month
  const days = getMonthDays(date);
  const s = new Date(days[0]);
  s.setHours(0, 0, 0, 0);
  const e = new Date(days[days.length - 1]);
  e.setHours(23, 59, 59, 999);
  return { start: s, end: e };
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragState, setDragState] = useState<{ id: string; startY: number; origTop: number } | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      const { start, end } = getViewRange(currentDate, view);
      const data = await calendarAPI.list({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setAppointments(data);
    } catch {
      // API not connected yet
    }
  }, [currentDate, view]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const navigate = (delta: number) => {
    const next = new Date(currentDate);
    if (view === "day") next.setDate(next.getDate() + delta);
    else if (view === "week") next.setDate(next.getDate() + delta * 7);
    else next.setMonth(next.getMonth() + delta);
    setCurrentDate(next);
  };

  const headerTitle = useMemo(() => {
    if (view === "day") return formatDate(currentDate);
    if (view === "week") {
      const days = getWeekDays(currentDate);
      const s = days[0];
      const e = days[6];
      if (s.getMonth() === e.getMonth()) {
        return `${s.getDate()}. – ${e.getDate()}. ${MONTHS_DE[s.getMonth()]} ${s.getFullYear()}`;
      }
      return `${s.getDate()}. ${MONTHS_DE[s.getMonth()]} – ${e.getDate()}. ${MONTHS_DE[e.getMonth()]} ${s.getFullYear()}`;
    }
    return `${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate, view]);

  // Multi-day appointments for week/day views (banner)
  const { multiDay, singleDay } = useMemo(() => {
    const md: Appointment[] = [];
    const sd: Appointment[] = [];
    appointments.forEach((a) => {
      if (a.is_multi_day || new Date(a.start_time).toDateString() !== new Date(a.end_time).toDateString()) {
        md.push(a);
      } else {
        sd.push(a);
      }
    });
    return { multiDay: md, singleDay: sd };
  }, [appointments]);

  // Drag & drop handlers (day view)
  const handleDragStart = (e: React.MouseEvent, id: string, currentTop: number) => {
    e.preventDefault();
    setDragState({ id, startY: e.clientY, origTop: currentTop });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;
      const deltaY = e.clientY - dragState.startY;
      const newTop = dragState.origTop + deltaY;
      setDragState((prev) => prev ? { ...prev, startY: e.clientY, origTop: newTop } : null);
    },
    [dragState]
  );

  const handleDragEnd = useCallback(async () => {
    if (!dragState) return;
    const newStartHour = 7 + dragState.origTop / HOUR_HEIGHT;
    const apt = appointments.find((a) => a.id === dragState.id);
    if (apt) {
      const origStart = new Date(apt.start_time);
      const origEnd = new Date(apt.end_time);
      const durationMs = origEnd.getTime() - origStart.getTime();
      const newStart = new Date(currentDate);
      newStart.setHours(Math.floor(newStartHour), (newStartHour % 1) * 60, 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);
      try {
        await calendarAPI.move(apt.id, newStart.toISOString(), newEnd.toISOString());
        loadAppointments();
      } catch { /* Revert */ }
    }
    setDragState(null);
  }, [dragState, appointments, currentDate, loadAppointments]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [dragState, handleDragMove, handleDragEnd]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
          <p className="text-gray-500">{headerTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center bg-white rounded-lg border border-surface-200">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-l-lg">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm font-medium hover:bg-surface-100">
              Heute
            </button>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-surface-100 rounded-r-lg">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-white rounded-lg border border-surface-200">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  view === v
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-surface-100"
                } ${v === "day" ? "rounded-l-lg" : v === "month" ? "rounded-r-lg" : ""}`}
              >
                {v === "day" ? "Tag" : v === "week" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>

          {/* Create */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            <span>Neuer Auftrag</span>
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {view === "day" && (
        <DayView
          date={currentDate}
          appointments={singleDay}
          multiDayAppointments={multiDay}
          dragState={dragState}
          onDragStart={handleDragStart}
        />
      )}
      {view === "week" && (
        <WeekView
          date={currentDate}
          appointments={appointments}
        />
      )}
      {view === "month" && (
        <MonthView
          date={currentDate}
          appointments={appointments}
          onDayClick={(d) => { setCurrentDate(d); setView("day"); }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          date={currentDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({
  date,
  appointments,
  multiDayAppointments,
  dragState,
  onDragStart,
}: {
  date: Date;
  appointments: Appointment[];
  multiDayAppointments: Appointment[];
  dragState: { id: string; startY: number; origTop: number } | null;
  onDragStart: (e: React.MouseEvent, id: string, top: number) => void;
}) {
  const getPos = (apt: Appointment) => {
    const s = new Date(apt.start_time);
    const e = new Date(apt.end_time);
    const sh = s.getHours() + s.getMinutes() / 60;
    const eh = e.getHours() + e.getMinutes() / 60;
    return { top: (sh - 7) * HOUR_HEIGHT, height: Math.max((eh - sh) * HOUR_HEIGHT, 30) };
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      {/* Multi-day banners */}
      {multiDayAppointments.length > 0 && (
        <div className="border-b border-surface-200 p-2 space-y-1">
          {multiDayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="px-3 py-1.5 rounded-lg text-sm text-white font-medium truncate"
              style={{ backgroundColor: apt.color || "#4c6ef5" }}
            >
              {apt.title} · {new Date(apt.start_time).toLocaleDateString("de-DE")} – {new Date(apt.end_time).toLocaleDateString("de-DE")}
            </div>
          ))}
        </div>
      )}

      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map((hour) => (
          <div key={hour} className="absolute left-0 right-0 border-t border-surface-100 flex" style={{ top: (hour - 7) * HOUR_HEIGHT }}>
            <span className="w-16 text-xs text-gray-400 px-2 -translate-y-1/2">
              {hour.toString().padStart(2, "0")}:00
            </span>
            <div className="flex-1" />
          </div>
        ))}
        <div className="absolute left-16 right-4 top-0 bottom-0">
          {appointments.map((apt) => {
            const pos = getPos(apt);
            const isDragging = dragState?.id === apt.id;
            return (
              <div
                key={apt.id}
                className={`absolute left-1 right-1 rounded-lg px-3 py-1.5 cursor-grab active:cursor-grabbing transition-shadow ${
                  isDragging ? "shadow-lg ring-2 ring-primary-300 z-10" : "shadow-sm"
                }`}
                style={{
                  top: isDragging ? dragState.origTop : pos.top,
                  height: pos.height,
                  backgroundColor: apt.color || "#4c6ef5",
                  opacity: isDragging ? 0.9 : 1,
                }}
                onMouseDown={(e) => onDragStart(e, apt.id, pos.top)}
              >
                <p className="text-white text-sm font-medium truncate">{apt.title}</p>
                <p className="text-white/80 text-xs">
                  {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(apt.end_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {apt.order_number && <p className="text-white/60 text-xs">{apt.order_number}</p>}
              </div>
            );
          })}
        </div>
        <CurrentTimeLine />
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const today = new Date();

  const multiDay = appointments.filter(
    (a) => a.is_multi_day || new Date(a.start_time).toDateString() !== new Date(a.end_time).toDateString()
  );
  const singleDay = appointments.filter(
    (a) => !a.is_multi_day && new Date(a.start_time).toDateString() === new Date(a.end_time).toDateString()
  );

  const getMultiDaySpan = (apt: Appointment) => {
    const aptStart = new Date(apt.start_time);
    const aptEnd = new Date(apt.end_time);
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    const visibleStart = aptStart < weekStart ? 0 : weekDays.findIndex((d) => isSameDay(d, aptStart));
    const visibleEnd = aptEnd > weekEnd ? 6 : weekDays.findIndex((d) => isSameDay(d, aptEnd));

    return {
      startCol: Math.max(visibleStart, 0),
      span: Math.max(visibleEnd - Math.max(visibleStart, 0) + 1, 1),
    };
  };

  const getDayAppointments = (day: Date) =>
    singleDay.filter((a) => isSameDay(new Date(a.start_time), day));

  const getPos = (apt: Appointment) => {
    const s = new Date(apt.start_time);
    const e = new Date(apt.end_time);
    const sh = s.getHours() + s.getMinutes() / 60;
    const eh = e.getHours() + e.getMinutes() / 60;
    return { top: (sh - 7) * HOUR_HEIGHT, height: Math.max((eh - sh) * HOUR_HEIGHT, 24) };
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
        <div className="p-2" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`p-2 text-center border-l border-surface-100 ${
              isSameDay(day, today) ? "bg-primary-50" : ""
            }`}
          >
            <div className="text-xs text-gray-400 font-medium">{DAYS_SHORT[(day.getDay())]}</div>
            <div className={`text-lg font-semibold ${
              isSameDay(day, today) ? "text-primary-600" : "text-gray-900"
            }`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Multi-day banners */}
      {multiDay.length > 0 && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
          <div className="p-1 text-xs text-gray-400 flex items-center justify-center">
            <CalendarIcon size={12} />
          </div>
          <div className="col-span-7 relative py-1 px-1 min-h-[28px]">
            {multiDay.map((apt) => {
              const { startCol, span } = getMultiDaySpan(apt);
              const colW = 100 / 7;
              return (
                <div
                  key={apt.id}
                  className="absolute h-6 rounded px-2 text-xs text-white font-medium flex items-center truncate"
                  style={{
                    left: `${startCol * colW}%`,
                    width: `${span * colW}%`,
                    backgroundColor: apt.color || "#4c6ef5",
                  }}
                >
                  {apt.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map((h) => (
            <div key={h} className="absolute left-0 right-0 text-right pr-2" style={{ top: (h - 7) * HOUR_HEIGHT }}>
              <span className="text-xs text-gray-400 -translate-y-1/2 inline-block">
                {h.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
        {weekDays.map((day, i) => {
          const dayApts = getDayAppointments(day);
          return (
            <div key={i} className="relative border-l border-surface-100" style={{ height: HOURS.length * HOUR_HEIGHT }}>
              {HOURS.map((h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-surface-50" style={{ top: (h - 7) * HOUR_HEIGHT }} />
              ))}
              {isSameDay(day, today) && <div className="absolute inset-0 bg-primary-50/30 pointer-events-none" />}
              {dayApts.map((apt) => {
                const pos = getPos(apt);
                return (
                  <div
                    key={apt.id}
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    style={{
                      top: pos.top,
                      height: pos.height,
                      backgroundColor: apt.color || "#4c6ef5",
                    }}
                  >
                    <p className="text-white text-xs font-medium truncate">{apt.title}</p>
                    <p className="text-white/70 text-[10px]">
                      {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  date,
  appointments,
  onDayClick,
}: {
  date: Date;
  appointments: Appointment[];
  onDayClick: (d: Date) => void;
}) {
  const days = useMemo(() => getMonthDays(date), [date]);
  const today = new Date();
  const currentMonth = date.getMonth();

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((a) => {
      const s = new Date(a.start_time);
      const e = new Date(a.end_time);
      return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
             day <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-surface-200">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-surface-100 last:border-b-0">
          {week.map((day, di) => {
            const dayApts = getAppointmentsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            return (
              <div
                key={di}
                onClick={() => onDayClick(day)}
                className={`min-h-[100px] p-1.5 border-l border-surface-100 first:border-l-0 cursor-pointer transition-colors hover:bg-surface-50 ${
                  !isCurrentMonth ? "bg-surface-50/50" : ""
                }`}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? "bg-primary-600 text-white"
                    : isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-300"
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-[11px] px-1.5 py-0.5 rounded truncate text-white font-medium"
                      style={{ backgroundColor: apt.color || "#4c6ef5" }}
                    >
                      {apt.title}
                    </div>
                  ))}
                  {dayApts.length > 3 && (
                    <div className="text-[10px] text-gray-400 pl-1">+{dayApts.length - 3} weitere</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Current Time Line ───────────────────────────────────────────────────────

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < 7 || currentHour > 21) return null;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (currentHour - 7) * HOUR_HEIGHT }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

// ─── Create Appointment Modal ────────────────────────────────────────────────

function CreateAppointmentModal({
  date,
  onClose,
  onCreated,
}: {
  date: Date;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(date.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(date.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [loading, setLoading] = useState(false);

  // CRM data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Vehicle inline creation
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleVin, setNewVehicleVin] = useState("");

  useEffect(() => {
    crmAPI.listCustomers().then(setCustomers).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      crmAPI.listLocations(selectedCustomerId).then(setLocations).catch(() => {});
      crmAPI.listVehicles(selectedCustomerId).then(setVehicles).catch(() => {});
      setSelectedLocationId("");
      setSelectedContactId("");
      setSelectedVehicleId("");
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedLocationId) {
      const loc = locations.find((l) => l.id === selectedLocationId);
      if (loc?.contact_persons) {
        setContacts(loc.contact_persons);
      }
      setSelectedContactId("");
    }
  }, [selectedLocationId, locations]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    const sd = new Date(startDate);
    const [sh, sm] = startTime.split(":").map(Number);
    sd.setHours(sh, sm, 0, 0);

    const ed = new Date(isMultiDay ? endDate : startDate);
    const [eh, em] = endTime.split(":").map(Number);
    ed.setHours(eh, em, 0, 0);

    let vehicleId = selectedVehicleId || undefined;

    // Create new vehicle inline
    if (showNewVehicle && selectedCustomerId && (newVehicleMake || newVehicleModel)) {
      try {
        const v = await crmAPI.createVehicle({
          customer_id: selectedCustomerId,
          make: newVehicleMake || undefined,
          model: newVehicleModel || undefined,
          license_plate: newVehiclePlate || undefined,
          vin: newVehicleVin || undefined,
        });
        vehicleId = v.id;
      } catch { /* ignore */ }
    }

    try {
      await calendarAPI.create({
        title,
        description: description || undefined,
        customer_id: selectedCustomerId || undefined,
        location_id: selectedLocationId || undefined,
        contact_person_id: selectedContactId || undefined,
        vehicle_id: vehicleId,
        start_time: sd.toISOString(),
        end_time: ed.toISOString(),
        is_multi_day: isMultiDay,
      });
      onCreated();
    } catch { /* Handle error */ } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "border-t border-surface-100 pt-4 mt-4";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1">Neuer Auftrag</h2>
        <p className="text-sm text-gray-400 mb-4">Erstellen Sie einen neuen Termin oder Auftrag</p>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Titel *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="z.B. Gutachten Heckschaden" />
          </div>

          {/* Customer section */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-xs">1</span>
              Kunde
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Kunde</label>
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className={inputClass}>
                  <option value="">— Kunde auswählen —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name || c.company || `${c.first_name} ${c.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomerId && locations.length > 0 && (
                <div>
                  <label className={labelClass}>Standort / Filiale</label>
                  <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)} className={inputClass}>
                    <option value="">— Standort auswählen —</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}{l.city ? ` (${l.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedLocationId && contacts.length > 0 && (
                <div>
                  <label className={labelClass}>Ansprechpartner</label>
                  <select value={selectedContactId} onChange={(e) => setSelectedContactId(e.target.value)} className={inputClass}>
                    <option value="">— Ansprechpartner auswählen —</option>
                    {contacts.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.first_name} {cp.last_name}{cp.role ? ` · ${cp.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle section */}
          {selectedCustomerId && (
            <div className={sectionClass}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-xs">2</span>
                Fahrzeug
              </h3>
              <div className="space-y-3">
                {vehicles.length > 0 && !showNewVehicle && (
                  <div>
                    <label className={labelClass}>Bestehendes Fahrzeug</label>
                    <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className={inputClass}>
                      <option value="">— Fahrzeug auswählen —</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {[v.make, v.model].filter(Boolean).join(" ")} {v.license_plate ? `· ${v.license_plate}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setShowNewVehicle(!showNewVehicle); setSelectedVehicleId(""); }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {showNewVehicle ? "← Bestehendes auswählen" : "+ Neues Fahrzeug anlegen"}
                </button>
                {showNewVehicle && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Hersteller</label>
                      <input value={newVehicleMake} onChange={(e) => setNewVehicleMake(e.target.value)} className={inputClass} placeholder="z.B. Mercedes Benz" />
                    </div>
                    <div>
                      <label className={labelClass}>Modell</label>
                      <input value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} className={inputClass} placeholder="z.B. C 300" />
                    </div>
                    <div>
                      <label className={labelClass}>Kennzeichen</label>
                      <input value={newVehiclePlate} onChange={(e) => setNewVehiclePlate(e.target.value)} className={inputClass} placeholder="z.B. S-AB 1234" />
                    </div>
                    <div>
                      <label className={labelClass}>Fahrgestellnr. (VIN)</label>
                      <input value={newVehicleVin} onChange={(e) => setNewVehicleVin(e.target.value)} className={inputClass} placeholder="17-stellig" maxLength={17} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timing section */}
          <div className={sectionClass}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-primary-100 text-primary-600 flex items-center justify-center text-xs">{selectedCustomerId ? "3" : "2"}</span>
              Termin
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={(e) => setIsMultiDay(e.target.checked)}
                  className="rounded border-surface-200 text-primary-600 focus:ring-primary-300"
                />
                Mehrtägiger Auftrag
              </label>
              <div className={`grid ${isMultiDay ? "grid-cols-2" : "grid-cols-2"} gap-3`}>
                <div>
                  <label className={labelClass}>{isMultiDay ? "Startdatum" : "Datum"}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                </div>
                {isMultiDay && (
                  <div>
                    <label className={labelClass}>Enddatum</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Von</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bis</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Beschreibung</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} min-h-[60px]`} placeholder="Schadensbeschreibung, Gutachtenart..." />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Erstelle..." : "Auftrag erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
