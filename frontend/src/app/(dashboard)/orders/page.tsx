"use client";

import { useState, useEffect, useCallback } from "react";
import { ordersAPI, crmAPI } from "@/services/api";
import type { OrderListItem, PaginatedOrderResponse, AppointmentStatus, Customer } from "@/types";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileText,
  MapPin,
  Car,
  User,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Geplant", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  confirmed: { label: "Bestätigt", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  in_progress: { label: "In Bearbeitung", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  completed: { label: "Abgeschlossen", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cancelled: { label: "Storniert", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  no_show: { label: "Nicht erschienen", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

export default function OrdersPage() {
  const [data, setData] = useState<PaginatedOrderResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Search & filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("start_time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ordersAPI.search({
        q: search || undefined,
        status: (statusFilter as AppointmentStatus) || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: 20,
      });
      setData(result);
    } catch {
      // API not connected
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, sortBy, sortDir, page]);

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = !!search || !!statusFilter || !!dateFrom || !!dateTo;

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const formatDateRange = (item: OrderListItem) => {
    const s = new Date(item.start_time);
    const e = new Date(item.end_time);
    const sDate = s.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const sTime = s.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    if (item.is_multi_day) {
      const eDate = e.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${sDate} – ${eDate}`;
    }
    const eTime = e.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    return `${sDate} · ${sTime} – ${eTime}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aufträge</h1>
          <p className="text-gray-500">
            {data ? `${data.total} Aufträge gesamt` : "Lade..."}
          </p>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          <span>Neuer Auftrag</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Suche nach Autohaus, Fahrzeug, Kennzeichen, VIN..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
            showFilters || hasFilters
              ? "bg-primary-50 border-primary-200 text-primary-700"
              : "bg-white border-surface-200 text-gray-600 hover:bg-surface-50"
          }`}
        >
          <Filter size={18} />
          <span className="text-sm font-medium">Filter</span>
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Alle Status</option>
              {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Datum von</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Datum bis</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} />
              Zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-surface-200 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_120px] gap-2 px-4 py-3 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <button onClick={() => toggleSort("order_number")} className="flex items-center gap-1 hover:text-gray-700">
            Nr. / Titel
            {sortBy === "order_number" && <ArrowUpDown size={12} />}
          </button>
          <div>Kunde / Standort</div>
          <div>Fahrzeug</div>
          <button onClick={() => toggleSort("start_time")} className="flex items-center gap-1 hover:text-gray-700">
            Termin
            {sortBy === "start_time" && <ArrowUpDown size={12} />}
          </button>
          <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-700">
            Status
            {sortBy === "status" && <ArrowUpDown size={12} />}
          </button>
        </div>

        {/* Rows */}
        {loading && !data && (
          <div className="py-16 text-center text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-primary-300 border-t-transparent rounded-full mx-auto mb-3" />
            Lade Aufträge...
          </div>
        )}

        {data?.items.map((item) => {
          const status = STATUS_LABELS[item.status] || STATUS_LABELS.scheduled;
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_120px] gap-2 px-4 py-3 border-b border-surface-100 hover:bg-surface-50/50 transition-colors cursor-pointer"
            >
              {/* Nr / Title */}
              <div className="min-w-0">
                {item.order_number && (
                  <p className="text-xs text-primary-600 font-mono font-medium">{item.order_number}</p>
                )}
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
              </div>

              {/* Customer / Location */}
              <div className="min-w-0 space-y-0.5">
                {item.customer_name && (
                  <p className="text-sm text-gray-900 font-medium truncate flex items-center gap-1.5">
                    <User size={13} className="text-gray-400 shrink-0" />
                    {item.customer_name}
                  </p>
                )}
                {(item.location_name || item.location_city) && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    {[item.location_name, item.location_city].filter(Boolean).join(", ")}
                  </p>
                )}
                {item.contact_person_name && (
                  <p className="text-xs text-gray-400 truncate">{item.contact_person_name}</p>
                )}
              </div>

              {/* Vehicle */}
              <div className="min-w-0 space-y-0.5">
                {item.vehicle_display && (
                  <p className="text-sm text-gray-900 truncate flex items-center gap-1.5">
                    <Car size={13} className="text-gray-400 shrink-0" />
                    {item.vehicle_display}
                  </p>
                )}
                {item.license_plate && (
                  <p className="text-xs font-mono text-gray-600 bg-surface-50 inline-block px-1.5 py-0.5 rounded">
                    {item.license_plate}
                  </p>
                )}
                {item.vin && (
                  <p className="text-[10px] text-gray-400 font-mono truncate">VIN: {item.vin}</p>
                )}
              </div>

              {/* Date */}
              <div className="min-w-0">
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-gray-400 shrink-0" />
                  {formatDateRange(item)}
                </p>
                {item.is_multi_day && (
                  <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full font-medium">
                    Mehrtägig
                  </span>
                )}
              </div>

              {/* Status */}
              <div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}

        {data && data.items.length === 0 && (
          <div className="py-16 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600">
              {hasFilters ? "Keine Aufträge gefunden" : "Noch keine Aufträge"}
            </h3>
            <p className="text-gray-400 mt-1">
              {hasFilters
                ? "Versuchen Sie andere Suchbegriffe oder Filter"
                : "Erstellen Sie Ihren ersten Auftrag im Kalender"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Seite {data.page} von {data.total_pages} · {data.total} Ergebnisse
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(data.total_pages, 7) }, (_, i) => {
              let pageNum: number;
              if (data.total_pages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= data.total_pages - 3) {
                pageNum = data.total_pages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-primary-600 text-white"
                      : "text-gray-600 hover:bg-surface-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
