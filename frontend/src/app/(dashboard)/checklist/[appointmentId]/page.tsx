"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Loader2, ArrowLeft, Gauge, AlertTriangle,
  Car, Camera, ScanSearch, ClipboardCheck
} from "lucide-react";
import { checklistAPI } from "@/services/api";
import type { Checklist, ChecklistPhoto } from "@/types";
import PhotoCapture from "@/components/ui/PhotoCapture";

const REQUIRED_PHOTOS = [
  { type: "front_left", label: "Frontansicht 45° links", required: true, icon: <Car size={20} className="text-orange-500" /> },
  { type: "front_right", label: "Frontansicht 45° rechts", required: true, icon: <Car size={20} className="text-orange-500" style={{ transform: "scaleX(-1)" }} /> },
  { type: "damage_1", label: "Vorschadendetails", required: false, icon: <AlertTriangle size={20} className="text-yellow-500" /> },
  { type: "rim_front", label: "Felge vorne links", required: false, icon: <Camera size={20} className="text-gray-500" /> },
  { type: "rim_rear", label: "Felge hinten rechts", required: false, icon: <Camera size={20} className="text-gray-500" /> },
  { type: "cockpit", label: "Cockpit / Instrumente", required: true, icon: <ScanSearch size={20} className="text-purple-500" /> },
];

export default function ChecklistPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const router = useRouter();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mileage, setMileage] = useState("");
  const [faultCodes, setFaultCodes] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(0); // 0=photos, 1=details, 2=done

  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    checklistAPI.get(appointmentId)
      .then((cl) => {
        setChecklist(cl);
        setMileage(cl.mileage?.toString() || "");
        setFaultCodes(cl.fault_codes || "");
        setNotes(cl.notes || "");
        // Map existing photos
        const photoMap: Record<string, string> = {};
        cl.photos.forEach((p) => { photoMap[p.photo_type] = p.file_url; });
        setUploadedPhotos(photoMap);
        if (cl.status === "completed") setStep(2);
      })
      .catch(() => {
        // Checklist might not exist yet — start fresh
      })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handlePhotoUpload = async (photoType: string, file: File) => {
    const result = await checklistAPI.uploadPhoto(appointmentId, photoType, file);
    setUploadedPhotos((prev) => ({ ...prev, [photoType]: result.file_url }));
  };

  const requiredDone = REQUIRED_PHOTOS.filter((p) => p.required).every(
    (p) => uploadedPhotos[p.type]
  );

  const handleComplete = async () => {
    setSaving(true);
    try {
      await checklistAPI.createOrUpdate(appointmentId, {
        status: "completed",
        mileage: mileage ? parseInt(mileage) : undefined,
        fault_codes: faultCodes || undefined,
        notes: notes || undefined,
      });
      setStep(2);
    } catch {
      alert("Fehler beim Speichern. Bitte nochmal versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await checklistAPI.createOrUpdate(appointmentId, {
        status: "in_progress",
        mileage: mileage ? parseInt(mileage) : undefined,
        fault_codes: faultCodes || undefined,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Completed state
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fertig!</h1>
        <p className="text-gray-500 mb-8">Die Kleine Annahme wurde erfolgreich abgeschlossen.</p>
        <button
          onClick={() => router.push("/calendar")}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Zurück zum Kalender
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kleine Annahme</h1>
          <p className="text-sm text-gray-500">Fahrzeug dokumentieren &amp; übernehmen</p>
        </div>
        <div className="ml-auto">
          <ClipboardCheck size={28} className="text-blue-500" />
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {["Fotos", "Details", "Abschluss"].map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Photos */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex gap-3 items-start">
            <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              Pflichtfotos sind mit <span className="text-red-500 font-bold">*</span> markiert. Bitte alle Fotos vor der Abholung aufnehmen.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {REQUIRED_PHOTOS.map((p) => (
              <PhotoCapture
                key={p.type}
                photoType={p.type}
                label={p.label}
                required={p.required}
                currentUrl={uploadedPhotos[p.type] || null}
                onCapture={handlePhotoUpload}
                icon={p.icon}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!requiredDone}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all mt-4 disabled:opacity-50 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed"
          >
            Weiter zu Details →
          </button>
          {!requiredDone && (
            <p className="text-center text-xs text-red-500">
              Bitte alle Pflichtfotos aufnehmen (* markiert)
            </p>
          )}
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Gauge size={16} className="text-blue-500" />
              Kilometerstand *
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="z.B. 48250"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-lg font-mono"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              Ausgelesene Fehlercodes
            </label>
            <textarea
              value={faultCodes}
              onChange={(e) => setFaultCodes(e.target.value)}
              placeholder="z.B. P0171 - System zu mager (Bank 1), P0420 - Katalysatorwirksamkeit..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 min-h-[100px] resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notizen / Besonderheiten
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Besondere Hinweise zur Abholung..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 min-h-[80px] resize-none text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={handleSaveProgress}
              disabled={saving}
              className="px-4 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              Speichern
            </button>
            <button
              onClick={handleComplete}
              disabled={saving || !mileage}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              Abnahme abschließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
