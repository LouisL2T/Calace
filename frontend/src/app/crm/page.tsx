"use client";

import { useState, useEffect } from "react";
import { crmAPI } from "@/services/api";
import { isDemoModeSync } from "@/lib/demo-mode";
import { MOCK_CUSTOMERS, MOCK_VEHICLES } from "@/lib/mock-data";
import type { Customer, Vehicle } from "@/types";
import { Search, Plus, User, Phone, Mail, Building, Car, X } from "lucide-react";

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    if (isDemoModeSync()) {
      if (search) {
        const s = search.toLowerCase();
        setCustomers(
          MOCK_CUSTOMERS.filter(
            (c) =>
              c.first_name.toLowerCase().includes(s) ||
              c.last_name.toLowerCase().includes(s) ||
              (c.company && c.company.toLowerCase().includes(s)) ||
              (c.email && c.email.toLowerCase().includes(s))
          )
        );
      } else {
        setCustomers(MOCK_CUSTOMERS);
      }
      return;
    }
    try {
      const data = await crmAPI.listCustomers(search || undefined);
      setCustomers(data);
    } catch {}
  };

  const getVehicles = (customerId: string): Vehicle[] => {
    if (isDemoModeSync()) {
      return MOCK_VEHICLES.filter((v) => v.customer_id === customerId);
    }
    return [];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-500">{customers.length} Kunden gesamt</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus size={18} />
          <span>Neuer Kunde</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kunden suchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

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

      {/* Customer Detail Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setSelectedCustomer(null)}>
          <div
            className="w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-surface-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {selectedCustomer.company && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building size={16} /> {selectedCustomer.company}
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} /> {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} /> {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.address && (
                  <p className="text-gray-500 text-sm">{selectedCustomer.address}</p>
                )}
              </div>

              {/* Vehicles */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Fahrzeuge</h3>
                {getVehicles(selectedCustomer.id).map((v) => (
                  <div key={v.id} className="bg-surface-50 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Car size={16} className="text-gray-400" />
                      <span className="font-medium text-sm">
                        {v.make} {v.model} ({v.year})
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex gap-3">
                      {v.license_plate && <span>Kennzeichen: {v.license_plate}</span>}
                      {v.color && <span>Farbe: {v.color}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Fields */}
              {selectedCustomer.custom_fields && Object.keys(selectedCustomer.custom_fields).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Zusatzfelder</h3>
                  <div className="bg-surface-50 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedCustomer.custom_fields).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-500">{key}</span>
                        <span className="font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
