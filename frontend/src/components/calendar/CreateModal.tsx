"use client";

import { useState, useEffect, useRef } from "react";
import { calendarAPI, crmAPI } from "@/services/api";
import type { Customer, Location, ContactPerson, Vehicle, TeamMember, AppointmentStatus, AppointmentPriority } from "@/types";
import { STATUS_LABELS, PRIO_LABELS, STATUS_COLORS, PRIO_COLORS } from "./helpers";
import { X, Scan, ChevronDown, MapPin, Phone } from "lucide-react";
import ColorPicker from "@/components/ui/ColorPicker";
import CustomerSearch from "@/components/ui/CustomerSearch";

interface CreateModalProps {
  date: Date;
  teamMembers: TeamMember[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAppointmentModal({ date, teamMembers, onClose, onCreated }: CreateModalProps) {
  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("open");
  const [priority, setPriority] = useState<AppointmentPriority>("medium");
  const [color, setColor] = useState<string | null>(null);

  // Scanner-Workflow
  const [needsScan, setNeedsScan] = useState(false);

  // Timing
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const [startDate, setStartDate] = useState(date.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(date.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [useTime, setUseTime] = useState(true);

  // Assignees (multi-select)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  // CRM cascading
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [autoFilledInfo, setAutoFilledInfo] = useState<{ phone?: string; address?: string } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => { crmAPI.listCustomers().then(setCustomers).catch(() => {}); }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      crmAPI.listLocations(selectedCustomerId).then((locs) => {
        setLocations(locs);
        // Auto-select if only one location
        if (locs.length === 1) {
          setSelectedLocationId(locs[0].id);
          if (locs[0].city || locs[0].street) {
            setLocationText(`${locs[0].name}${locs[0].city ? ", " + locs[0].city : ""}`);
          }
        } else {
          setSelectedLocationId("");
        }
        setSelectedContactId("");
        setAutoFilledInfo(null);
      }).catch(() => {});
    } else {
      setLocations([]);
      setSelectedLocationId("");
      setSelectedContactId("");
      setAutoFilledInfo(null);
    }
  }, [selectedCustomerId]);

  useEffect(() => {
    if (selectedLocationId) {
      const loc = locations.find((l) => l.id === selectedLocationId);
      if (loc) {
        setContacts(loc.contact_persons || []);
        // Auto-select primary contact
        const primary = loc.contact_persons?.find((cp) => cp.is_primary);
        if (primary) {
          setSelectedContactId(primary.id);
          setAutoFilledInfo({ phone: primary.phone || primary.mobile || undefined });
        } else if (loc.contact_persons?.length === 1) {
          const cp = loc.contact_persons[0];
          setSelectedContactId(cp.id);
          setAutoFilledInfo({ phone: cp.phone || cp.mobile || undefined });
        } else {
          setSelectedContactId("");
          setAutoFilledInfo(null);
        }
        // Auto-fill location text
        if (loc.street || loc.city) {
          setLocationText(`${loc.name}${loc.city ? ", " + loc.city : ""}`);
        }
      }
    } else {
      setContacts([]);
      setAutoFilledInfo(null);
    }
  }, [selectedLocationId, locations]);

  const handleCustomerSelect = (customerId: string, customer: Customer | null) => {
    setSelectedCustomerId(customerId);
  };

  const toggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    const sd = new Date(startDate);
    if (useTime) { const [sh, sm] = startTime.split(":").map(Number); sd.setHours(sh, sm, 0, 0); }
    else { sd.setHours(0, 0, 0, 0); }

    const isMultiDay = startDate !== endDate;
    const ed = new Date(isMultiDay ? endDate : startDate);
    if (useTime) { const [eh, em] = endTime.split(":").map(Number); ed.setHours(eh, em, 0, 0); }
    else { ed.setHours(23, 59, 59, 0); }

    try {
      await calendarAPI.create({
        title,
        description: description || undefined,
        location_text: locationText || undefined,
        status,
        priority,
        color: color || undefined,
        needs_scan: needsScan,
        customer_id: selectedCustomerId || undefined,
        location_id: selectedLocationId || undefined,
        contact_person_id: selectedContactId || undefined,
        start_time: sd.toISOString(),
        end_time: ed.toISOString(),
        is_multi_day: isMultiDay,
        assigned_to_ids: selectedAssigneeIds,
      });
      onCreated();
    } catch { /* handle */ } finally { setLoading(false); }
  };

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm bg-white";
  const lbl = "block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Neuer Auftrag</h2>
            <p className="text-xs text-gray-400">Schnell einen neuen Einsatz anlegen</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Title */}
          <div>
            <label className={lbl}>Name *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inp}
              placeholder="z.B. Hagelschaden-Gutachten BMW"
              autoFocus
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)} className={inp}>
                {(["open", "in_progress", "completed", "postponed"] as AppointmentStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Priorität</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as AppointmentPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      priority === p
                        ? "text-white shadow-sm"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                    style={priority === p ? { backgroundColor: PRIO_COLORS[p] } : {}}
                  >
                    {PRIO_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Farbe */}
          <div className="border-t border-gray-100 pt-4">
            <ColorPicker value={color} onChange={setColor} label="Auftragsfarbe" />
          </div>

          {/* Scanner-Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <div
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                needsScan
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
              onClick={() => setNeedsScan(!needsScan)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  needsScan ? "bg-blue-100" : "bg-gray-200"
                }`}>
                  <Scan size={18} className={needsScan ? "text-blue-600" : "text-gray-400"} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${needsScan ? "text-blue-800" : "text-gray-700"}`}>
                    Fahrzeug muss gescannt werden
                  </p>
                  <p className="text-xs text-gray-400">
                    {needsScan
                      ? "Scanner Operator wird automatisch benachrichtigt"
                      : "Kein Scan erforderlich"
                    }
                  </p>
                </div>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${needsScan ? "bg-blue-500" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${needsScan ? "translate-x-5" : ""}`} />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Termin</h3>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTime}
                  onChange={(e) => setUseTime(e.target.checked)}
                  className="rounded border-gray-200"
                />
                Mit Uhrzeit
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Startdatum</label>
                {/* Clicking anywhere in this div opens the date picker */}
                <div
                  className={`${inp} cursor-pointer flex items-center`}
                  onClick={() => startDateRef.current?.showPicker?.()}
                >
                  <input
                    ref={startDateRef}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full outline-none bg-transparent cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>
              <div>
                <label className={lbl}>Enddatum</label>
                <div
                  className={`${inp} cursor-pointer flex items-center`}
                  onClick={() => endDateRef.current?.showPicker?.()}
                >
                  <input
                    ref={endDateRef}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full outline-none bg-transparent cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>
            </div>
            {useTime && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={lbl}>Von</label>
                  <div
                    className={`${inp} cursor-pointer`}
                    onClick={() => startTimeRef.current?.showPicker?.()}
                  >
                    <input
                      ref={startTimeRef}
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full outline-none bg-transparent cursor-pointer"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Bis</label>
                  <div
                    className={`${inp} cursor-pointer`}
                    onClick={() => endTimeRef.current?.showPicker?.()}
                  >
                    <input
                      ref={endTimeRef}
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full outline-none bg-transparent cursor-pointer"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verantwortliche */}
          {teamMembers.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Verantwortliche</h3>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {teamMembers.map((m) => (
                  <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAssigneeIds.includes(m.id)}
                      onChange={() => toggleAssignee(m.id)}
                    />
                    <span className="text-sm text-gray-700">{m.full_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{m.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Kunde → Standort → Ansprechpartner (mit Autofill) */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Kunde &amp; Standort</h3>
            <div className="space-y-3">
              <div>
                <label className={lbl}>Kunde</label>
                <CustomerSearch
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelect={handleCustomerSelect}
                  placeholder="Firma oder Name suchen…"
                />
              </div>

              {selectedCustomerId && locations.length > 0 && (
                <div>
                  <label className={lbl}>Standort / Filiale</label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className={inp}
                  >
                    <option value="">— Standort auswählen —</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}{l.city ? ` (${l.city})` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedLocationId && contacts.length > 0 && (
                <div>
                  <label className={lbl}>Ansprechpartner</label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => {
                      setSelectedContactId(e.target.value);
                      const cp = contacts.find((c) => c.id === e.target.value);
                      if (cp) setAutoFilledInfo({ phone: cp.phone || cp.mobile || undefined });
                    }}
                    className={inp}
                  >
                    <option value="">— Ansprechpartner auswählen —</option>
                    {contacts.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.first_name} {cp.last_name}{cp.role ? ` · ${cp.role}` : ""}{cp.is_primary ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Auto-filled info chips */}
              {autoFilledInfo && (autoFilledInfo.phone) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {autoFilledInfo.phone && (
                    <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                      <Phone size={11} />
                      <span>{autoFilledInfo.phone}</span>
                    </div>
                  )}
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <span className="text-green-400">✓</span> Auto-befüllt
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ort + Beschreibung */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className={lbl}>Ort (Freitext)</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className={`${inp} pl-8`}
                  placeholder="z.B. Parkplatz Halle 3, Autohaus Stuttgart"
                />
              </div>
            </div>
            <div>
              <label className={lbl}>Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inp} min-h-[60px] resize-none`}
                placeholder="Schadensbeschreibung, Hinweise…"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {needsScan && <Scan size={14} />}
            {loading ? "Erstelle…" : "Auftrag erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
