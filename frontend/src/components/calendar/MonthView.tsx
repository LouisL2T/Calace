"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types";
import { getMonthDays, isSameDay, getAppointmentColor } from "./helpers";

export default function MonthView({
  date, appointments, onDayClick,
}: {
  date: Date;
  appointments: Appointment[];
  onDayClick: (d: Date) => void;
}) {
  const days = useMemo(() => getMonthDays(date), [date]);
  const today = new Date();
  const currentMonth = date.getMonth();

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter(a => {
      const s = new Date(a.start_time);
      const e = new Date(a.end_time);
      return day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
             day <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden view-enter">
      <div className="grid grid-cols-7 border-b border-surface-200">
        {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-surface-100 last:border-b-0">
          {week.map((day, di) => {
            const dayApts = getAppointmentsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            return (
              <div key={di} onClick={() => onDayClick(day)}
                className={`min-h-[100px] p-1.5 border-l border-surface-100 first:border-l-0 cursor-pointer transition-colors hover:bg-surface-50 ${!isCurrentMonth ? "bg-surface-50/50" : ""}`}>
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary-600 text-white" : isCurrentMonth ? "text-gray-900" : "text-gray-300"}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayApts.slice(0, 3).map(apt => (
                    <div key={apt.id} className="text-[11px] px-1.5 py-0.5 rounded truncate text-white font-medium flex items-center gap-1"
                      style={{ backgroundColor: getAppointmentColor(apt) }}>
                      <span className={`prio-dot prio-dot-${apt.priority}`} />
                      <span className="truncate">{apt.title}</span>
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
