"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types";
import { isSameDay, getAppointmentColor, STATUS_LABELS, PRIO_LABELS } from "./helpers";
import { Clock, MapPin, User, AlertCircle } from "lucide-react";

export default function TimelineView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  const days = useMemo(() => {
    const result: { label: string; date: Date }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() + i);
      const label = i === 0 ? "Heute" : i === 1 ? "Morgen" : "Übermorgen";
      result.push({ label, date: d });
    }
    return result;
  }, [date]);

  const getAptsForDay = (day: Date) =>
    appointments
      .filter(a => {
        const s = new Date(a.start_time);
        const e = new Date(a.end_time);
        return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
               day <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <div className="space-y-4 view-enter">
      {days.map(({ label, date: day }) => {
        const dayApts = getAptsForDay(day);
        const isToday = isSameDay(day, new Date());
        return (
          <div key={label} className="bg-white rounded-xl border border-surface-200 overflow-hidden timeline-stripe">
            {/* Day header */}
            <div className={`px-5 py-3 border-b border-surface-100 flex items-center justify-between ${isToday ? "bg-primary-50" : "bg-surface-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${isToday ? "bg-primary-600 text-white" : "bg-surface-200 text-gray-600"}`}>
                  {day.getDate()}
                </div>
                <div>
                  <h3 className={`font-semibold ${isToday ? "text-primary-700" : "text-gray-900"}`}>{label}</h3>
                  <p className="text-xs text-gray-400">{day.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${dayApts.length > 0 ? "bg-primary-100 text-primary-700" : "bg-surface-100 text-gray-400"}`}>
                {dayApts.length} {dayApts.length === 1 ? "Einsatz" : "Einsätze"}
              </span>
            </div>

            {/* Appointments */}
            {dayApts.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-300 text-sm">Keine Einsätze geplant</div>
            ) : (
              <div className="divide-y divide-surface-50">
                {dayApts.map(apt => (
                  <div key={apt.id} className="px-5 py-3 flex items-start gap-4 hover:bg-surface-50/50 transition-colors cursor-pointer group">
                    {/* Time column */}
                    <div className="flex-shrink-0 w-[70px] pt-0.5">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(apt.end_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Color bar */}
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: getAppointmentColor(apt) }} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`prio-dot prio-dot-${apt.priority}`} />
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{apt.title}</h4>
                        <span className={`status-badge status-${apt.status} ml-auto flex-shrink-0`}>
                          {STATUS_LABELS[apt.status] || apt.status}
                        </span>
                      </div>
                      {apt.description && (
                        <p className="text-xs text-gray-500 truncate mb-1">{apt.description}</p>
                      )}
                      <div className="flex items-center gap-4 flex-wrap">
                        {apt.location_text && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={11} /> {apt.location_text}
                          </span>
                        )}
                        {apt.assigned_to_names?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <User size={11} /> {apt.assigned_to_names.join(", ")}
                          </span>
                        )}
                        <span className={`prio-badge prio-${apt.priority} text-[10px]`}>
                          {PRIO_LABELS[apt.priority]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
