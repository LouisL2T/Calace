"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Building2, User } from "lucide-react";
import type { Customer, Location, ContactPerson } from "@/types";

interface CustomerSearchProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelect: (customerId: string, customer: Customer | null) => void;
  placeholder?: string;
}

export default function CustomerSearch({
  customers,
  selectedCustomerId,
  onSelect,
  placeholder = "Kunde suchen…",
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selected customer display name when id is provided externally
  useEffect(() => {
    if (selectedCustomerId) {
      const c = customers.find((c) => c.id === selectedCustomerId) || null;
      setSelectedCustomer(c);
      if (c) setQuery(getDisplayName(c));
    } else {
      setSelectedCustomer(null);
      setQuery("");
    }
  }, [selectedCustomerId, customers]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Restore display name if a customer is selected
        if (selectedCustomer) setQuery(getDisplayName(selectedCustomer));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedCustomer]);

  const getDisplayName = (c: Customer) =>
    c.company_name || c.company || `${c.first_name} ${c.last_name}`.trim();

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      getDisplayName(c).toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  }).slice(0, 12);

  const handleSelect = (c: Customer) => {
    setSelectedCustomer(c);
    setQuery(getDisplayName(c));
    setOpen(false);
    onSelect(c.id, c);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedCustomer(null);
    onSelect("", null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) {
      setSelectedCustomer(null);
      onSelect("", null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg text-sm transition-all ${
          open
            ? "border-blue-400 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-gray-300"
        } bg-white`}
      >
        <Search size={14} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 flex items-center gap-3 transition-colors ${
                selectedCustomer?.id === c.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                {c.customer_type === "company" ? (
                  <Building2 size={14} className="text-white" />
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{getDisplayName(c)}</p>
                {c.email && (
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                )}
              </div>
              {selectedCustomer?.id === c.id && (
                <span className="ml-auto text-blue-500 text-xs font-medium flex-shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-3 py-4 text-center">
          <p className="text-sm text-gray-400">Kein Kunde gefunden</p>
        </div>
      )}
    </div>
  );
}
