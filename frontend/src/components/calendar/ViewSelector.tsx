"use client";

import { useState, useEffect } from "react";
import {
  BookOpen, User, Building2, Scan, Plus, Trash2, Save, X, Users
} from "lucide-react";
import { calendarAPI } from "@/services/api";
import type { SavedView, TeamMember } from "@/types";

interface ViewSelectorProps {
  teamMembers: TeamMember[];
  onSelectView: (filters: { assigned_to?: string; customer_id?: string; needs_scan?: boolean }) => void;
  currentFilters: { assigned_to?: string; customer_id?: string; needs_scan?: boolean };
}

const QUICK_VIEWS: SavedView[] = [
  { id: "__all", name: "Alle Aufträge", icon: "📅" },
  { id: "__scan", name: "Scan-Aufträge", needs_scan: true, icon: "🔍" },
];

export default function ViewSelector({ teamMembers, onSelectView, currentFilters }: ViewSelectorProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>("__all");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    calendarAPI.listSavedViews().then(setSavedViews).catch(() => {});
  }, []);

  const handleSelectView = (view: SavedView) => {
    setActiveViewId(view.id || "__all");
    onSelectView({
      assigned_to: view.assigned_to,
      customer_id: view.customer_id,
      needs_scan: view.needs_scan,
    });
  };

  const handleSelectEmployee = (memberId: string) => {
    setActiveViewId(`__emp_${memberId}`);
    onSelectView({ assigned_to: memberId });
  };

  const handleSaveCurrentView = async () => {
    if (!newViewName.trim()) return;
    setSaving(true);
    try {
      const view: SavedView = {
        name: newViewName,
        ...currentFilters,
        icon: currentFilters.needs_scan ? "🔍" : currentFilters.assigned_to ? "👤" : "📅",
      };
      const saved = await calendarAPI.saveView(view);
      setSavedViews((prev) => [...prev, saved]);
      setNewViewName("");
      setShowSaveForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteView = async (id: string) => {
    await calendarAPI.deleteSavedView(id);
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  };

  const NavItem = ({ view, isActive, onDelete }: {
    view: SavedView & { id: string };
    isActive: boolean;
    onDelete?: () => void;
  }) => (
    <div
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
      onClick={() => handleSelectView(view)}
    >
      <span className="text-base">{view.icon || "📌"}</span>
      <span className="text-sm flex-1 truncate">{view.name}</span>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-56 bg-white border-r border-gray-100 h-full flex flex-col py-4 px-2 gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Ansichten</p>

      {/* Quick Views */}
      {QUICK_VIEWS.map((view) => (
        <NavItem
          key={view.id!}
          view={view as SavedView & { id: string }}
          isActive={activeViewId === view.id}
        />
      ))}

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-2" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Mitarbeiter</p>
          {teamMembers.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                activeViewId === `__emp_${m.id}`
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => handleSelectEmployee(m.id)}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">
                  {m.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate">{m.full_name}</span>
            </div>
          ))}
        </>
      )}

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <>
          <div className="border-t border-gray-100 my-2" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Gespeichert</p>
          {savedViews.map((view) => (
            <NavItem
              key={view.id}
              view={view as SavedView & { id: string }}
              isActive={activeViewId === view.id}
              onDelete={() => handleDeleteView(view.id!)}
            />
          ))}
        </>
      )}

      {/* Save Current View */}
      <div className="border-t border-gray-100 mt-auto pt-3">
        {showSaveForm ? (
          <div className="px-2 space-y-2">
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Name der Ansicht…"
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveCurrentView(); }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowSaveForm(false)}
                className="flex-1 py-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveCurrentView}
                disabled={saving || !newViewName.trim()}
                className="flex-1 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "…" : "Speichern"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="flex items-center gap-2 px-3 py-2 w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Save size={13} />
            Ansicht speichern
          </button>
        )}
      </div>
    </div>
  );
}
