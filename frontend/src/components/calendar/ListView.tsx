"use client";

import { useMemo, useState } from "react";
import type { Appointment, AppointmentStatus, AppointmentPriority } from "@/types";
import { STATUS_LABELS, PRIO_LABELS } from "./helpers";
import { ArrowUpDown, Search, MapPin, User } from "lucide-react";

type SortKey = "title" | "start_time" | "status" | "priority" | "location_text";
type SortDir = "asc" | "desc";

export default function ListView({ appointments }: { appointments: Appointment[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("start_time");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = [...appointments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.location_text?.toLowerCase().includes(q) ||
        a.order_number?.toLowerCase().includes(q) ||
        a.assigned_to_names?.some(n => n.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => {
      let va: string = "", vb: string = "";
      if (sortKey === "start_time") {
        return sortDir === "asc"
          ? new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          : new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      }
      va = (a[sortKey] as string) || "";
      vb = (b[sortKey] as string) || "";
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [appointments, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th onClick={() => toggleSort(k)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none group">
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={`transition-colors ${sortKey === k ? "text-primary-600" : "text-gray-300 group-hover:text-gray-400"}`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden view-enter">
      {/* Search bar */}
      <div className="p-4 border-b border-surface-100">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Aufgabe, Ort, Verantwortlichem…"
            className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[900px]">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <SortHeader label="Aufgabe" k="title" />
              <SortHeader label="Fälligkeit" k="start_time" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Beschreibung</th>
              <SortHeader label="Ort" k="location_text" />
              <SortHeader label="Prio" k="priority" />
              <SortHeader label="Status" k="status" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verantwortlich</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">Keine Einträge gefunden</td></tr>
            )}
            {filtered.map(apt => (
              <tr key={apt.id} className="hover:bg-surface-50/50 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{apt.title}</div>
                  {apt.order_number && <div className="text-xs text-gray-400">{apt.order_number}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{new Date(apt.start_time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(apt.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {apt.end_time && ` – ${new Date(apt.end_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-sm text-gray-600 truncate">{apt.description || "–"}</p>
                </td>
                <td className="px-4 py-3">
                  {apt.location_text ? (
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{apt.location_text}</span>
                    </div>
                  ) : <span className="text-gray-300">–</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`prio-badge prio-${apt.priority}`}>{PRIO_LABELS[apt.priority] || apt.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`status-badge status-${apt.status}`}>{STATUS_LABELS[apt.status] || apt.status}</span>
                </td>
                <td className="px-4 py-3">
                  {apt.assigned_to_names?.length > 0 ? (
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <User size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{apt.assigned_to_names.join(", ")}</span>
                    </div>
                  ) : <span className="text-gray-300">–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-100 text-xs text-gray-400">
        {filtered.length} Einträge
      </div>
    </div>
  );
}
