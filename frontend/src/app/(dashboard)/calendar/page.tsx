"use client";

import { useState, useEffect, useCallback } from "react";
import { calendarAPI } from "@/services/api";
import { isDemoModeSync } from "@/lib/demo-mode";
import { MOCK_APPOINTMENTS } from "@/lib/mock-data";
import type { Appointment } from "@/types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const HOUR_HEIGHT = 60;

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragState, setDragState] = useState<{ id: string; startY: number; origTop: number } | null>(null);

  const loadAppointments = useCallback(async () => {
    if (isDemoModeSync()) {
      // Filter mock appointments for current day
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      setAppointments(
        MOCK_APPOINTMENTS.filter((a) => {
          const start = new Date(a.start_time);
          return start >= dayStart && start <= dayEnd;
        })
      );
      return;
    }
    try {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      const data = await calendarAPI.list({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setAppointments(data);
    } catch {}
  }, [currentDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getEventPosition = (apt: Appointment) => {
    const start = new Date(apt.start_time);
    const end = new Date(apt.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    return {
      appointment: apt,
      top: (startHour - 7) * HOUR_HEIGHT,
      height: Math.max((endHour - startHour) * HOUR_HEIGHT, 30),
    };
  };

  const navigateDay = (delta: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setCurrentDate(next);
  };

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

      if (isDemoModeSync()) {
        // Update in local state for demo
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === apt.id
              ? { ...a, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
              : a
          )
        );
      } else {
        try {
          await calendarAPI.move(apt.id, newStart.toISOString(), newEnd.toISOString());
          loadAppointments();
        } catch {}
      }
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

  const dateStr = currentDate.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
          <p className="text-gray-500">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-surface-200">
            <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-surface-100 rounded-l-lg">
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium hover:bg-surface-100"
            >
              Heute
            </button>
            <button onClick={() => navigateDay(1)} className="p-2 hover:bg-surface-100 rounded-r-lg">
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={18} />
            <span>Neuer Termin</span>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Heute", value: appointments.length, color: "text-primary-600" },
          { label: "Bestätigt", value: appointments.filter((a) => a.status === "confirmed").length, color: "text-green-600" },
          { label: "In Arbeit", value: appointments.filter((a) => a.status === "in_progress").length, color: "text-amber-600" },
          { label: "Offen", value: appointments.filter((a) => a.status === "scheduled").length, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-surface-200 px-4 py-3">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Day View */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-surface-100 flex"
              style={{ top: (hour - 7) * HOUR_HEIGHT }}
            >
              <span className="w-16 text-xs text-gray-400 px-2 -translate-y-1/2">
                {hour.toString().padStart(2, "0")}:00
              </span>
              <div className="flex-1" />
            </div>
          ))}

          {/* Appointments */}
          <div className="absolute left-16 right-4 top-0 bottom-0">
            {appointments.map((apt) => {
              const pos = getEventPosition(apt);
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
                  onMouseDown={(e) => handleDragStart(e, apt.id, pos.top)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium truncate">{apt.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[apt.status] || ""}`}>
                      {apt.status}
                    </span>
                  </div>
                  {/* Sachverständiger & Ansprechpartner */}
                  {(apt.sachverstaendiger || apt.ansprechpartner) && pos.height > 40 && (
                    <div className="text-white/90 text-xs mt-0.5">
                      {apt.sachverstaendiger && <span className="font-medium">{apt.sachverstaendiger}</span>}
                      {apt.sachverstaendiger && apt.ansprechpartner && <span className="mx-1">•</span>}
                      {apt.ansprechpartner && <span>{apt.ansprechpartner}</span>}
                    </div>
                  )}
                  {/* Datum-Bereich */}
                  {apt.start_date && apt.end_date && apt.start_date !== apt.end_date && pos.height > 55 && (
                    <p className="text-white/70 text-[10px] mt-0.5">
                      {new Date(apt.start_date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} – {new Date(apt.end_date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    </p>
                  )}
                  <p className="text-white/80 text-xs">
                    {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(apt.end_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {apt.description && pos.height > 70 && (
                    <p className="text-white/60 text-xs mt-0.5 truncate">{apt.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          <CurrentTimeLine />
        </div>
      </div>

      {showCreateModal && (
        <CreateAppointmentModal
          date={currentDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={(apt) => {
            setShowCreateModal(false);
            if (isDemoModeSync()) {
              setAppointments((prev) => [...prev, apt]);
            } else {
              loadAppointments();
            }
          }}
        />
      )}
    </div>
  );
}

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < 7 || currentHour > 21) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: (currentHour - 7) * HOUR_HEIGHT }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

function CreateAppointmentModal({
  date,
  onClose,
  onCreated,
}: {
  date: Date;
  onClose: () => void;
  onCreated: (apt: Appointment) => void;
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(date.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(date.toISOString().split("T")[0]);
  const [sachverstaendiger, setSachverstaendiger] = useState("");
  const [ansprechpartner, setAnsprechpartner] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    const start = new Date(startDate);
    start.setHours(8, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(17, 0, 0, 0);

    if (isDemoModeSync()) {
      const newApt: Appointment = {
        id: `demo-${Date.now()}`,
        tenant_id: "t1",
        title,
        description: null,
        customer_id: null,
        assigned_to: null,
        project_id: null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        start_date: startDate,
        end_date: endDate,
        sachverstaendiger: sachverstaendiger || null,
        ansprechpartner: ansprechpartner || null,
        color: "#4c6ef5",
        status: "scheduled",
        metadata: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onCreated(newApt);
    } else {
      try {
        const apt = await calendarAPI.create({
          title,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          start_date: startDate,
          end_date: endDate,
          sachverstaendiger: sachverstaendiger || null,
          ansprechpartner: ansprechpartner || null,
        });
        onCreated(apt);
      } catch {}
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Neuer Termin</h2>
        <div className="space-y-4">
          {/* Datum Von/Bis - ON TOP */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Datum Von</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                data-testid="start-date-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Datum Bis</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                data-testid="end-date-input"
              />
            </div>
          </div>

          {/* Zuständiger Sachverständiger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zuständiger Sachverständiger</label>
            <input
              value={sachverstaendiger}
              onChange={(e) => setSachverstaendiger(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="z.B. Max Mustermann"
              data-testid="sachverstaendiger-input"
            />
          </div>

          {/* Ansprechpartner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ansprechpartner (z.B. Autohaus)</label>
            <input
              value={ansprechpartner}
              onChange={(e) => setAnsprechpartner(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="z.B. Autohaus Schmidt"
              data-testid="ansprechpartner-input"
            />
          </div>

          {/* Titel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="z.B. Hagelschaden – BMW 3er"
              autoFocus
              data-testid="title-input"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg transition-colors" data-testid="cancel-btn">
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            data-testid="create-appointment-btn"
          >
            {loading ? "Erstelle..." : "Termin erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
