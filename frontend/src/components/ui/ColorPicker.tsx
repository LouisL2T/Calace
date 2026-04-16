"use client";

import { useState } from "react";

const PRESET_COLORS = [
  "#EF4444", // Rot
  "#F97316", // Orange
  "#EAB308", // Gelb
  "#22C55E", // Grün
  "#06B6D4", // Cyan
  "#3B82F6", // Blau
  "#8B5CF6", // Violett
  "#EC4899", // Pink
  "#64748B", // Grau-Blau
  "#78716C", // Braun-Grau
  "#1F2937", // Dunkelgrau
  "#FFFFFF", // Weiß (kein Farbcode)
];

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label = "Farbe" }: ColorPickerProps) {
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Kein-Farbe-Button */}
        <button
          type="button"
          title="Keine Farbe"
          onClick={() => onChange(null)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            !value ? "border-gray-800 ring-2 ring-gray-400 ring-offset-1" : "border-gray-300 hover:border-gray-500"
          } bg-white`}
        >
          <span className="text-gray-400 text-xs font-bold">×</span>
        </button>

        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onChange(color)}
            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
              value === color
                ? "border-gray-800 ring-2 ring-offset-1 ring-gray-400 scale-110"
                : "border-transparent hover:border-gray-300"
            }`}
            style={{ backgroundColor: color, boxShadow: color === "#FFFFFF" ? "inset 0 0 0 1px #d1d5db" : undefined }}
          />
        ))}

        {/* Custom-Farbe-Picker */}
        <div className="relative">
          <button
            type="button"
            title="Eigene Farbe"
            onClick={() => setCustomOpen(!customOpen)}
            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-400 hover:border-gray-600 flex items-center justify-center transition-all"
            style={{
              background: value && !PRESET_COLORS.includes(value)
                ? value
                : "linear-gradient(135deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f)",
            }}
          >
            {(!value || PRESET_COLORS.includes(value)) && (
              <span className="text-white text-xs font-bold drop-shadow">+</span>
            )}
          </button>
          {customOpen && (
            <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-2">Eigene Farbe:</p>
              <input
                type="color"
                value={value && !PRESET_COLORS.includes(value) ? value : "#3B82F6"}
                onChange={(e) => onChange(e.target.value)}
                className="w-32 h-10 cursor-pointer rounded border border-gray-200"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setCustomOpen(false)}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {value && (
        <div
          className="mt-2 h-1.5 rounded-full"
          style={{ backgroundColor: value, width: "100%", maxWidth: "200px" }}
        />
      )}
    </div>
  );
}
