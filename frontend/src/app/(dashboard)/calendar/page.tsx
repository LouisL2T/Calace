"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useCalendarStore } from "@/store";
import { calendarAPI, crmAPI } from "@/services/api";
import type { CalendarView } from "@/types";
import {
  DayView, WeekView, MonthView, YearView, ListView, TimelineView,
  CreateAppointmentModal, FilterBar,
  MONTHS_DE, formatDateDE, getWeekDays, getViewRange,
} from "@/components/calendar";
import { Plus, ChevronLeft, ChevronRight, Calendar, List, Clock, LayoutGrid, Columns } from "lucide-react";
import { useState } from "react";

const VIEW_CONFIG: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
  { key: "day",      label: "Tag",      icon: <Calendar size={14} /> },
  { key: "week",     label: "Woche",    icon: <Columns size={14} /> },
  { key: "month",    label: "Monat",    icon: <LayoutGrid size={14} /> },
  { key: "year",     label: "Jahr",     icon: <Calendar size={14} /> },
  { key: "list",     label: "Liste",    icon: <List size={14} /> },
  { key: "timeline", label: "Timeline", icon: <Clock size={14} /> },
];

export default function CalendarPage() {
  const {
    currentDate, currentView, filters, teamMembers,
    setCurrentDate, setCurrentView, setAppointments, setTeamMembers,
    setFilters, resetFilters, setIsLoading, getFilteredAppointments,
  } = useCalendarStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load appointments for the current view range
  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { start, end } = getViewRange(currentDate, currentView);
      const data = await calendarAPI.list({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      setAppointments(data);
    } catch {
      // API not connected
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, currentView, setAppointments, setIsLoading]);

  // Load team members once
  useEffect(() => {
    calendarAPI.listTeamMembers().then(setTeamMembers).catch(() => {});
  }, [setTeamMembers]);

  // Load appointments on date/view change
  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  // Navigation
  const navigate = (delta: number) => {
    const next = new Date(currentDate);
    if (currentView === "day" || currentView === "timeline") next.setDate(next.getDate() + delta);
    else if (currentView === "week") next.setDate(next.getDate() + delta * 7);
    else if (currentView === "year") next.setFullYear(next.getFullYear() + delta);
    else next.setMonth(next.getMonth() + delta);
    setCurrentDate(next);
  };

  // Header title
  const headerTitle = useMemo(() => {
    if (currentView === "year") return `${currentDate.getFullYear()}`;
    if (currentView === "day") return formatDateDE(currentDate);
    if (currentView === "timeline") {
      const end = new Date(currentDate);
      end.setDate(end.getDate() + 2);
      return `${currentDate.getDate()}. – ${end.getDate()}. ${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (currentView === "week") {
      const days = getWeekDays(currentDate);
      const s = days[0]; const e = days[6];
      if (s.getMonth() === e.getMonth()) {
        return `${s.getDate()}. – ${e.getDate()}. ${MONTHS_DE[s.getMonth()]} ${s.getFullYear()}`;
      }
      return `${s.getDate()}. ${MONTHS_DE[s.getMonth()]} – ${e.getDate()}. ${MONTHS_DE[e.getMonth()]} ${s.getFullYear()}`;
    }
    return `${MONTHS_DE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate, currentView]);

  // Get filtered appointments from store (instant, no re-fetch)
  const appointments = getFilteredAppointments();

  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Einsatzplanung</h1>
          <p className="text-sm text-gray-500">{headerTitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          {/* Top row: Navigate and Create */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-lg border border-surface-200 shadow-sm">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-l-lg transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-xs font-medium hover:bg-surface-100 transition-colors">
                Heute
              </button>
              <button onClick={() => navigate(1)} className="p-2 hover:bg-surface-100 rounded-r-lg transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm">
              <Plus size={16} />
              <span>Neu</span>
            </button>
          </div>

          {/* Bottom row: View Switcher */}
          <div className="flex items-center bg-white rounded-lg border border-surface-200 shadow-sm overflow-x-auto w-full sm:w-auto">
            {VIEW_CONFIG.map((v, i) => (
              <button key={v.key} onClick={() => setCurrentView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  currentView === v.key
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-surface-100"
                } ${i === 0 ? "rounded-l-lg" : ""} ${i === VIEW_CONFIG.length - 1 ? "rounded-r-lg" : ""}`}>
                {v.icon}
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ────────────────────────────────────────────── */}
      <div className="mb-4">
        <FilterBar
          status={filters.status}
          priority={filters.priority}
          assigneeId={filters.assigneeId}
          searchText={filters.searchText}
          teamMembers={teamMembers}
          onStatusChange={(v) => setFilters({ status: v })}
          onPriorityChange={(v) => setFilters({ priority: v })}
          onAssigneeChange={(v) => setFilters({ assigneeId: v })}
          onSearchChange={(v) => setFilters({ searchText: v })}
          onReset={resetFilters}
        />
      </div>

      {/* ─── View Content (instant switch, same data) ──────────────── */}
      {currentView === "day" && <DayView date={currentDate} appointments={appointments} />}
      {currentView === "week" && <WeekView date={currentDate} appointments={appointments} />}
      {currentView === "month" && (
        <MonthView date={currentDate} appointments={appointments}
          onDayClick={(d) => { setCurrentDate(d); setCurrentView("day"); }} />
      )}
      {currentView === "year" && (
        <YearView
          date={currentDate}
          appointments={appointments}
          onMonthClick={(m) => {
            const next = new Date(currentDate);
            next.setMonth(m);
            setCurrentDate(next);
            setCurrentView("month");
          }}
        />
      )}
      {currentView === "list" && <ListView appointments={appointments} />}
      {currentView === "timeline" && <TimelineView date={currentDate} appointments={appointments} />}

      {/* ─── Create Modal ──────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateAppointmentModal
          date={currentDate}
          teamMembers={teamMembers}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadAppointments(); }}
        />
      )}
    </div>
  );
}
