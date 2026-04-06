"use client";

import { useState, useEffect, useRef } from "react";
import { businessAPI } from "@/services/api";
import type { TimeEntry } from "@/types";
import { Play, Square, Clock } from "lucide-react";

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadEntries();
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
    try {
      const entry = await businessAPI.startTimer({ description: description || undefined });
      setActiveEntry(entry);
      setDescription("");
    } catch {}
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Zeiterfassung</h1>

      {/* Timer */}
      <div className="bg-white rounded-2xl border border-surface-200 p-8 mb-8 text-center">
        <div className="text-5xl font-mono font-bold text-gray-900 mb-6">
          {formatDuration(elapsed)}
        </div>

        {!activeEntry ? (
          <div className="space-y-4">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was arbeiten Sie gerade? (optional)"
              className="w-full max-w-md mx-auto block px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-center"
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
                    {new Date(entry.start_time).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm text-gray-600">
                {entry.duration_seconds ? formatDuration(entry.duration_seconds) : "--:--:--"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
