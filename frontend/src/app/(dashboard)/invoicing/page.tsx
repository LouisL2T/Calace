"use client";

import { useState, useEffect } from "react";
import { businessAPI } from "@/services/api";
import type { Invoice } from "@/types";
import { FileText, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  sent: "Gesendet",
  paid: "Bezahlt",
  overdue: "Überfällig",
  cancelled: "Storniert",
};

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await businessAPI.listInvoices();
      setInvoices(data);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechnungen</h1>
          <p className="text-gray-500">{invoices.length} Rechnungen</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={18} />
          <span>Neue Rechnung</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nr.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Datum</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Netto</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">MwSt</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(inv.issue_date).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">{Number(inv.subtotal).toFixed(2)} €</td>
                <td className="px-4 py-3 text-sm text-right text-gray-500">{Number(inv.tax_amount).toFixed(2)} €</td>
                <td className="px-4 py-3 text-sm text-right font-semibold">{Number(inv.total).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Noch keine Rechnungen</h3>
            <p className="text-gray-400 mt-1">Rechnungen werden automatisch aus Terminen erstellt</p>
          </div>
        )}
      </div>
    </div>
  );
}
