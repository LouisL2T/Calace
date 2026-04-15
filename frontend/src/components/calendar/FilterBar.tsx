"use client";

import { useState } from "react";
import type { AppointmentStatus, AppointmentPriority, TeamMember } from "@/types";
import { STATUS_LABELS, PRIO_LABELS } from "./helpers";
import { Filter, X } from "lucide-react";

interface FilterBarProps {
  status: AppointmentStatus | "";
  priority: AppointmentPriority | "";
  assigneeId: string;
  searchText: string;
  teamMembers: TeamMember[];
  onStatusChange: (v: AppointmentStatus | "") => void;
  onPriorityChange: (v: AppointmentPriority | "") => void;
  onAssigneeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onReset: () => void;
}

export default function FilterBar({
  status, priority, assigneeId, searchText,
  teamMembers, onStatusChange, onPriorityChange, onAssigneeChange, onSearchChange, onReset,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasFilters = !!(status || priority || assigneeId || searchText);
  const selectClass = "w-full px-2.5 py-1.5 border border-surface-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-300";

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${
          hasFilters ? "border-primary-500 bg-primary-50 text-primary-600" : "border-surface-200 bg-white text-gray-500 hover:bg-surface-50"
        }`}
        title="Filter"
      >
        <Filter size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-surface-200 rounded-xl shadow-lg z-50 flex flex-col gap-3 min-w-[200px] animate-module-appear">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</label>
              <select value={status} onChange={e => onStatusChange(e.target.value as AppointmentStatus | "")} className={selectClass}>
                <option value="">Alle Status</option>
                {(["open","in_progress","completed","postponed"] as AppointmentStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Priorität</label>
              <select value={priority} onChange={e => onPriorityChange(e.target.value as AppointmentPriority | "")} className={selectClass}>
                <option value="">Alle Prioritäten</option>
                {(["low","medium","high"] as AppointmentPriority[]).map(p => (
                  <option key={p} value={p}>{PRIO_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Verantwortliche</label>
              <select value={assigneeId} onChange={e => onAssigneeChange(e.target.value)} className={selectClass}>
                <option value="">Alle Verantwortliche</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button onClick={() => { onReset(); setIsOpen(false); }}
                className="mt-1 flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100 font-medium">
                <X size={12} /> Filter zurücksetzen
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
