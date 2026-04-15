"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types";
import { MONTHS_DE } from "./helpers";

interface YearViewProps {
  date: Date;
  appointments: Appointment[];
  onMonthClick?: (month: number) => void;
}

export function YearView({ date, appointments, onMonthClick }: YearViewProps) {
  const currentYear = date.getFullYear();
  const today = new Date();

  // Group appointments by month (0-11)
  const appointmentsByMonth = useMemo(() => {
    const counts = new Array(12).fill(0);
    appointments.forEach((a) => {
      const d = new Date(a.start_time);
      if (d.getFullYear() === currentYear) {
        counts[d.getMonth()]++;
      }
    });
    return counts;
  }, [appointments, currentYear]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-surface-200">
      {MONTHS_DE.map((monthName, idx) => {
        const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === idx;
        const count = appointmentsByMonth[idx];

        return (
          <div
            key={idx}
            className={`border rounded-xl p-4 transition-colors cursor-pointer ${
              isCurrentMonth
                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                : "border-surface-200 hover:border-primary-300 hover:bg-surface-50"
            }`}
            onClick={() => onMonthClick?.(idx)}
          >
            <h3 className={`text-lg font-semibold mb-2 ${isCurrentMonth ? "text-primary-700" : "text-gray-900"}`}>
              {monthName}
            </h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {count === 1 ? "1 Termin" : `${count} Termine`}
              </span>
              {count > 0 && (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                  {count}
                </div>
              )}
            </div>
            
            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                {/* 
                 A real year view might render mini-calendars here. 
                 For simplicity, we show high-level stats and an interactive card. 
                */}
            </div>
          </div>
        );
      })}
    </div>
  );
}
