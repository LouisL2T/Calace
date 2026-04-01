"use client";

import { useState, useEffect, useCallback } from "react";
import { calendarAPI } from "@/services/api";
import type { Appointment } from "@/types";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  appointment: Appointment;
  top: number;
  height: number;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00
const HOUR_HEIGHT = 60; // px per hour

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragState, setDragState] = useState<{ id: string; startY: number; origTop: number } | null>(null);

  const loadAppointments = useCallback(async () => {
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
    } catch {
      // API not connected yet
    }
  }, [currentDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getEventPosition = (apt: Appointment): CalendarEvent => {
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
      // Visual feedback via CSS transform (handled in render)
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
      } catch {
        // Revert
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

      {/* Day View */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Hour lines */}
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
                  <p className="text-white text-sm font-medium truncate">{apt.title}</p>
                  <p className="text-white/80 text-xs">
                    {new Date(apt.start_time).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(apt.end_time).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Current time indicator */}
          <CurrentTimeLine />
        </div>
      </div>

      {/* Create Modal (simplified) */}
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
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    const start = new Date(date);
    const [sh, sm] = startTime.split(":").map(Number);
    start.setHours(sh, sm, 0, 0);

    const end = new Date(date);
    const [eh, em] = endTime.split(":").map(Number);
    end.setHours(eh, em, 0, 0);

    try {
      await calendarAPI.create({
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      onCreated();
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Neuer Termin</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="z.B. Fahrzeug-Inspektion"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Erstelle..." : "Termin erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
