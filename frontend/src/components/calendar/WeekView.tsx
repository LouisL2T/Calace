"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types";
import { HOURS, HOUR_HEIGHT, DAYS_SHORT, isSameDay, getWeekDays, getAppointmentColor, getTimePos } from "./helpers";
import { Calendar as CalendarIcon } from "lucide-react";

export default function WeekView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  const weekDays = useMemo(() => getWeekDays(date), [date]);
  const today = new Date();

  const multiDay = appointments.filter(
    a => a.is_multi_day || new Date(a.start_time).toDateString() !== new Date(a.end_time).toDateString()
  );
  const singleDay = appointments.filter(
    a => !a.is_multi_day && new Date(a.start_time).toDateString() === new Date(a.end_time).toDateString()
  );

  const getMultiDaySpan = (apt: Appointment) => {
    const aptStart = new Date(apt.start_time);
    const aptEnd = new Date(apt.end_time);
    const weekEnd = weekDays[6];
    const visibleStart = aptStart < weekDays[0] ? 0 : weekDays.findIndex(d => isSameDay(d, aptStart));
    const visibleEnd = aptEnd > weekEnd ? 6 : weekDays.findIndex(d => isSameDay(d, aptEnd));
    return {
      startCol: Math.max(visibleStart, 0),
      span: Math.max(visibleEnd - Math.max(visibleStart, 0) + 1, 1),
    };
  };

  const getDayAppointments = (day: Date) => singleDay.filter(a => isSameDay(new Date(a.start_time), day));

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden view-enter">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
        <div className="p-2" />
        {weekDays.map((day, i) => (
          <div key={i} className={`p-2 text-center border-l border-surface-100 ${isSameDay(day, today) ? "bg-primary-50" : ""}`}>
            <div className="text-xs text-gray-400 font-medium">{DAYS_SHORT[day.getDay()]}</div>
            <div className={`text-lg font-semibold ${isSameDay(day, today) ? "text-primary-600" : "text-gray-900"}`}>{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Multi-day banners */}
      {multiDay.length > 0 && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-200">
          <div className="p-1 text-xs text-gray-400 flex items-center justify-center"><CalendarIcon size={12} /></div>
          <div className="col-span-7 relative py-1 px-1 min-h-[28px]">
            {multiDay.map((apt, idx) => {
              const { startCol, span } = getMultiDaySpan(apt);
              const colW = 100 / 7;
              return (
                <div key={apt.id}
                  className="absolute h-6 rounded px-2 text-xs text-white font-medium flex items-center gap-1 truncate"
                  style={{ left: `${startCol * colW}%`, width: `${span * colW}%`, top: idx * 28, backgroundColor: getAppointmentColor(apt) }}>
                  <span className={`prio-dot prio-dot-${apt.priority}`} />
                  {apt.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {HOURS.map(h => (
            <div key={h} className="absolute left-0 right-0 text-right pr-2" style={{ top: (h - 7) * HOUR_HEIGHT }}>
              <span className="text-xs text-gray-400 -translate-y-1/2 inline-block">{h.toString().padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        {weekDays.map((day, i) => {
          const dayApts = getDayAppointments(day);
          return (
            <div key={i} className="relative border-l border-surface-100" style={{ height: HOURS.length * HOUR_HEIGHT }}>
              {HOURS.map(h => (
                <div key={h} className="absolute left-0 right-0 border-t border-surface-50" style={{ top: (h - 7) * HOUR_HEIGHT }} />
              ))}
              {isSameDay(day, today) && <div className="absolute inset-0 bg-primary-50/30 pointer-events-none" />}
              {dayApts.map(apt => {
                const pos = getTimePos(apt);
                return (
                  <div key={apt.id}
                    className="absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                    style={{ top: pos.top, height: pos.height, backgroundColor: getAppointmentColor(apt) }}>
                    <div className="flex items-center gap-1">
                      <span className={`prio-dot prio-dot-${apt.priority}`} />
                      <p className="text-white text-xs font-medium truncate">{apt.title}</p>
                    </div>
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
