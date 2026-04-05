"use client";

import { useState, useEffect, useRef } from "react";
import { businessAPI } from "@/services/api";
import { isDemoModeSync } from "@/lib/demo-mode";
import { MOCK_TIME_ENTRIES } from "@/lib/mock-data";
import type { TimeEntry } from "@/types";
import { Play, Square, Clock } from "lucide-react";

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isDemoModeSync()) {
      setEntries(MOCK_TIME_ENTRIES);
    } else {
      loadEntries();
    }
  }, []);

  useEffect(() => {
    if (activeEntry) {
      timerRef.current = setInterval(() => {
        const start = new Date(activeEntry.start_time).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setElapsed(0);
    }
  }, [activeEntry]);

  const loadEntries = async () => {
    try {
      const data = await businessAPI.listTimeEntries();
      setEntries(data);
      const running = data.find((e) => !e.end_time);
      if (running) setActiveEntry(running);
    } catch {}
  };

  const startTimer = async () => {
    if (isDemoModeSync()) {
      const entry: TimeEntry = {
        id: `demo-${Date.now()}`,
        user_id: "u1",
        project_id: null,
        appointment_id: null,
        description: description || null,
        start_time: new Date().toISOString(),
        end_time: null,
        duration_seconds: null,
      };
      setActiveEntry(entry);
      setDescription("");
      return;
    }
    try {
      const entry = await businessAPI.startTimer({ description: description || undefined });
      setActiveEntry(entry);
      setDescription("");
    } catch {}
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    if (isDemoModeSync()) {
      const dur = Math.floor((Date.now() - new Date(activeEntry.start_time).getTime()) / 1000);
      const stopped: TimeEntry = {
        ...activeEntry,
        end_time: new Date().toISOString(),
        duration_seconds: dur,
      };
      setEntries((prev) => [stopped, ...prev]);
      setActiveEntry(null);
      return;
    }
    try {
      await businessAPI.stopTimer(activeEntry.id);
      setActiveEntry(null);
      loadEntries();
    } catch {}
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalToday = entries
    .filter((e) => e.duration_seconds)
    .reduce((sum, e) => sum + (e.duration_seconds || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Zeiterfassung</h1>

      {/* Timer */}
      <div className="bg-white rounded-2xl border border-surface-200 p-8 mb-8 text-center">
        <div className="text-6xl font-mono font-bold text-gray-900 mb-6 tabular-nums">
          {formatDuration(elapsed)}
        </div>

        {!activeEntry ? (
          <div className="space-y-4">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was arbeiten Sie gerade? (optional)"
              className="w-full max-w-md mx-auto block px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-center"
              onKeyDown={(e) => e.key === "Enter" && startTimer()}
            />
            <button
              onClick={startTimer}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-lg font-medium"
            >
              <Play size={22} />
              Starten
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeEntry.description && (
              <p className="text-gray-500">{activeEntry.description}</p>
            )}
            <button
              onClick={stopTimer}
              className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-lg font-medium"
            >
              <Square size={22} />
              Stoppen
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
          <p className="text-xs text-gray-400">Gesamtzeit (Einträge)</p>
          <p className="text-xl font-bold text-primary-600">{formatDuration(totalToday)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
          <p className="text-xs text-gray-400">Einträge</p>
          <p className="text-xl font-bold text-gray-900">{entries.filter((e) => e.end_time).length}</p>
        </div>
      </div>

      {/* History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Letzte Einträge</h2>
      <div className="space-y-2">
        {entries
          .filter((e) => e.end_time)
          .map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-surface-200 px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {entry.description || "Ohne Beschreibung"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.start_time).toLocaleDateString("de-DE")}{" "}
                    {new Date(entry.start_time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(entry.end_time!).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm text-gray-600 tabular-nums">
                {entry.duration_seconds ? formatDuration(entry.duration_seconds) : "--:--:--"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
