"use client";

import { useMemo, useState, useEffect } from "react";
import type { Appointment } from "@/types";
import { HOURS, HOUR_HEIGHT, isSameDay, getAppointmentColor, getTimePos } from "./helpers";

function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);
  const ch = now.getHours() + now.getMinutes() / 60;
  if (ch < 7 || ch > 21) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: (ch - 7) * HOUR_HEIGHT }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

export default function DayView({ date, appointments }: { date: Date; appointments: Appointment[] }) {
  const multiDay = useMemo(() => appointments.filter(a =>
    a.is_multi_day || new Date(a.start_time).toDateString() !== new Date(a.end_time).toDateString()
  ), [appointments]);

  const singleDay = useMemo(() => appointments.filter(a =>
    !a.is_multi_day && new Date(a.start_time).toDateString() === new Date(a.end_time).toDateString()
  ).filter(a => isSameDay(new Date(a.start_time), date)), [appointments, date]);

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden view-enter">
      {multiDay.length > 0 && (
        <div className="border-b border-surface-200 p-2 space-y-1">
          {multiDay.map(apt => (
            <div key={apt.id} className="px-3 py-1.5 rounded-lg text-sm text-white font-medium truncate flex items-center gap-2"
              style={{ backgroundColor: getAppointmentColor(apt) }}>
              <span className={`prio-dot prio-dot-${apt.priority}`} />
              {apt.title}
              <span className="text-white/70 text-xs ml-auto">
                {new Date(apt.start_time).toLocaleDateString("de-DE")} – {new Date(apt.end_time).toLocaleDateString("de-DE")}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map(hour => (
          <div key={hour} className="absolute left-0 right-0 border-t border-surface-100 flex" style={{ top: (hour - 7) * HOUR_HEIGHT }}>
            <span className="w-16 text-xs text-gray-400 px-2 -translate-y-1/2">{hour.toString().padStart(2, "0")}:00</span>
            <div className="flex-1" />
          </div>
        ))}
        <div className="absolute left-16 right-4 top-0 bottom-0">
          {singleDay.map(apt => {
            const pos = getTimePos(apt);
            return (
              <div key={apt.id} className="absolute left-1 right-1 rounded-lg px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                style={{ top: pos.top, height: pos.height, backgroundColor: getAppointmentColor(apt) }}>
                <div className="flex items-center gap-1.5">
                  <span className={`prio-dot prio-dot-${apt.priority}`} />
                  <p className="text-white text-sm font-medium truncate">{apt.title}</p>
                </div>
                <p className="text-white/80 text-xs">
                  {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – {new Date(apt.end_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {apt.assigned_to_names?.length > 0 && (
                  <p className="text-white/60 text-xs truncate">{apt.assigned_to_names.join(", ")}</p>
                )}
              </div>
            );
          })}
        </div>
        <CurrentTimeLine />
      </div>
    </div>
  );
}
