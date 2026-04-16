"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, Palette, Building2, User, Tag } from "lucide-react";
import { colorRulesAPI } from "@/services/api";
import type { ColorRule } from "@/types";
import ColorPicker from "@/components/ui/ColorPicker";

const RULE_TYPES = [
  { value: "employee", label: "Mitarbeiter", icon: <User size={14} /> },
  { value: "order_type", label: "Auftragsart", icon: <Tag size={14} /> },
  { value: "customer", label: "Kunde/Firma", icon: <Building2 size={14} /> },
] as const;

const RULE_TYPE_LABELS: Record<string, string> = {
  employee: "Mitarbeiter",
  order_type: "Auftragsart",
  customer: "Kunde/Firma",
};

export default function ColorsSettingsPage() {
  const [rules, setRules] = useState<ColorRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string>("#3B82F6");
  const [ruleType, setRuleType] = useState<"employee" | "order_type" | "customer">("order_type");
  const [saving, setSaving] = useState(false);

  const fetchRules = () => {
    setLoading(true);
    colorRulesAPI.list().then(setRules).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const resetForm = () => {
    setEditId(null);
    setLabel("");
    setColor("#3B82F6");
    setRuleType("order_type");
    setShowForm(false);
  };

  const handleEdit = (rule: ColorRule) => {
    setEditId(rule.id);
    setLabel(rule.label);
    setColor(rule.color);
    setRuleType(rule.rule_type as typeof ruleType);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!label.trim() || !color) return;
    setSaving(true);
    try {
      if (editId) {
        await colorRulesAPI.update(editId, { label, color, rule_type: ruleType });
      } else {
        await colorRulesAPI.create({ label, color, rule_type: ruleType, reference_id: null });
      }
      fetchRules();
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Farbregel wirklich löschen?")) return;
    await colorRulesAPI.delete(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const grouped = RULE_TYPES.map((rt) => ({
    ...rt,
    rules: rules.filter((r) => r.rule_type === rt.value),
  }));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Palette size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Farbregeln</h1>
            <p className="text-sm text-gray-500">Farbkodierung nach Mitarbeiter, Auftragsart oder Kunde konfigurieren</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={16} />
          Neue Regel
        </button>
      </div>

      {/* Info-Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
        <strong>So funktioniert es:</strong> Wenn du beim Erstellen eines Auftrags manuell keine Farbe wählst, 
        wird die passende Farbregel automatisch angewendet – zum Beispiel basierend auf dem zuständigen Mitarbeiter 
        oder der Auftragsart im Titel.
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            {editId ? "Farbregel bearbeiten" : "Neue Farbregel"}
          </h2>

          <div className="space-y-4">
            {/* Rule Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Art der Regel</label>
              <div className="flex gap-2">
                {RULE_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setRuleType(rt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      ruleType === rt.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {rt.icon} {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                {ruleType === "employee" ? "Mitarbeitername" : ruleType === "order_type" ? "Auftragsart / Schlüsselwort" : "Kundenname"}
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  ruleType === "employee" ? "z.B. Max Mustermann"
                  : ruleType === "order_type" ? "z.B. Hagelschaden, Gutachten, Inspektion"
                  : "z.B. Autohaus Stuttgart GmbH"
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>

            {/* Color */}
            <ColorPicker value={color} onChange={(c) => setColor(c || "#3B82F6")} label="Farbe" />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !label.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              {saving ? "Speichere…" : <><Check size={14} /> Speichern</>}
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Lädt…</div>
      ) : rules.length === 0 ? (
        <div className="py-16 text-center">
          <Palette size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Noch keine Farbregeln angelegt</p>
          <p className="text-sm text-gray-300 mt-1">Füge deine erste Regel hinzu</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.filter((g) => g.rules.length > 0).map((group) => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-400">{group.icon}</span>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group.label}</h3>
              </div>
              <div className="space-y-2">
                {group.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 hover:border-gray-200 transition-all"
                  >
                    {/* Color swatch */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: rule.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{rule.label}</p>
                      <p className="text-xs text-gray-400">{rule.color} · {RULE_TYPE_LABELS[rule.rule_type]}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
