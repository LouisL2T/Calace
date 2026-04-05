"use client";

import { useState, useEffect } from "react";
import { businessAPI } from "@/services/api";
import { isDemoModeSync } from "@/lib/demo-mode";
import { MOCK_MATERIALS } from "@/lib/mock-data";
import type { MaterialItem } from "@/types";
import { Package, Plus, AlertTriangle } from "lucide-react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  useEffect(() => {
    if (isDemoModeSync()) {
      setMaterials(MOCK_MATERIALS);
    } else {
      loadMaterials();
    }
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await businessAPI.listMaterials();
      setMaterials(data);
    } catch {}
  };

  const lowStockCount = materials.filter((m) => m.quantity_in_stock <= m.min_stock_level).length;
  const totalValue = materials.reduce(
    (sum, m) => sum + m.quantity_in_stock * (m.unit_price || 0),
    0
  );

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
          <p className="text-xs text-gray-400">Gesamtwert</p>
          <p className="text-xl font-bold text-primary-600">{totalValue.toFixed(2)} &euro;</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 px-4 py-3">
          <p className="text-xs text-gray-400">Artikel</p>
          <p className="text-xl font-bold text-gray-900">{materials.length}</p>
        </div>
        <div className={`bg-white rounded-xl border px-4 py-3 ${lowStockCount > 0 ? "border-red-200" : "border-surface-200"}`}>
          <p className="text-xs text-gray-400">Niedrig im Bestand</p>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`}>
            {lowStockCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((item) => {
          const isLow = item.quantity_in_stock <= item.min_stock_level;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${isLow ? "border-red-200" : "border-surface-200"}`}
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

              {item.description && (
                <p className="text-xs text-gray-500 mb-3">{item.description}</p>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{item.quantity_in_stock}</span>
                  <span className="text-sm text-gray-400 ml-1">{item.unit}</span>
                </div>
                {item.unit_price && (
                  <span className="text-sm text-gray-500">{Number(item.unit_price).toFixed(2)} &euro;/{item.unit}</span>
                )}
              </div>

              {item.sku && (
                <p className="text-xs text-gray-400 mt-2">SKU: {item.sku}</p>
              )}

              {/* Stock bar */}
              <div className="mt-3">
                <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-green-400"}`}
                    style={{ width: `${Math.min((item.quantity_in_stock / Math.max(item.min_stock_level * 3, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
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
