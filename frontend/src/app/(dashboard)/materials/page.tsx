"use client";

import { useState, useEffect } from "react";
import { businessAPI } from "@/services/api";
import type { MaterialItem } from "@/types";
import { Package, Plus, AlertTriangle } from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await businessAPI.listMaterials();
      setMaterials(data);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materialbestand</h1>
          <p className="text-gray-500">{materials.length} Artikel</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={18} />
          <span>Neuer Artikel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((item) => {
          const isLow = item.quantity_in_stock <= item.min_stock_level;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${
                isLow ? "border-red-200" : "border-surface-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.category && (
                    <span className="text-xs text-gray-400">{item.category}</span>
                  )}
                </div>
                {isLow && (
                  <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                    <AlertTriangle size={14} />
                    Niedrig
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{item.quantity_in_stock}</span>
                  <span className="text-sm text-gray-400 ml-1">{item.unit}</span>
                </div>
                {item.unit_price && (
                  <span className="text-sm text-gray-500">{Number(item.unit_price).toFixed(2)} €/{item.unit}</span>
                )}
              </div>

              {item.sku && (
                <p className="text-xs text-gray-400 mt-2">SKU: {item.sku}</p>
              )}
            </div>
          );
        })}
      </div>

      {materials.length === 0 && (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Kein Material erfasst</h3>
          <p className="text-gray-400 mt-1">Fügen Sie Ihre Verbrauchsmaterialien hinzu</p>
        </div>
      )}
    </div>
  );
}
