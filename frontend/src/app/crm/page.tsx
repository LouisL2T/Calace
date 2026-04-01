"use client";

import { useState, useEffect } from "react";
import { crmAPI } from "@/services/api";
import type { Customer } from "@/types";
import { Search, Plus, User, Phone, Mail, Building } from "lucide-react";

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      const data = await crmAPI.listCustomers(search || undefined);
      setCustomers(data);
    } catch {
      // API not connected
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-500">{customers.length} Kunden gesamt</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          <span>Neuer Kunde</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kunden suchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => setSelectedCustomer(customer)}
            className="bg-white rounded-xl border border-surface-200 p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={18} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {customer.first_name} {customer.last_name}
                </h3>
                {customer.company && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Building size={12} />
                    {customer.company}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-gray-600">
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {customer.email}
                </div>
              )}
            </div>

            {/* Show custom fields if present */}
            {customer.custom_fields && Object.keys(customer.custom_fields).length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-100">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(customer.custom_fields).slice(0, 3).map(([key, val]) => (
                    <span key={key} className="px-2 py-0.5 bg-surface-50 rounded text-xs text-gray-500">
                      {key}: {String(val)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="text-center py-16">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Noch keine Kunden</h3>
          <p className="text-gray-400 mt-1">Erstellen Sie Ihren ersten Kunden</p>
        </div>
      )}
    </div>
  );
}
