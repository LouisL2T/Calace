"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crmAPI } from "@/services/api";
import type { Customer } from "@/types";
import { Search, Plus, User, Phone, Mail, Building, MapPin, X } from "lucide-react";

export default function CRMPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
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

  const getDisplayName = (c: Customer) =>
    c.company_name || c.company || `${c.first_name} ${c.last_name}`;

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
            onClick={() => router.push(`/crm/${customer.id}`)}
            className="bg-white rounded-xl border border-surface-200 p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                {customer.customer_type === "company" ? (
                  <Building size={18} className="text-primary-600" />
                ) : (
                  <User size={18} className="text-primary-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{getDisplayName(customer)}</h3>
                {customer.customer_type === "company" && customer.first_name && (
                  <p className="text-xs text-gray-500">
                    {customer.first_name} {customer.last_name}
                  </p>
                )}
                <p className="text-xs text-gray-400 capitalize">
                  {customer.customer_type === "company" ? "Unternehmen" : "Privatperson"}
                </p>
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

      {customers.length === 0 && (
        <div className="text-center py-16">
          <User size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Noch keine Kunden</h3>
          <p className="text-gray-400 mt-1">Erstellen Sie Ihren ersten Kunden</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CustomerCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadCustomers(); }}
        />
      )}
    </div>
  );
}

function CustomerCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customerType, setCustomerType] = useState<"company" | "individual">("company");
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (customerType === "company" && !companyName.trim()) return;
    if (customerType === "individual" && (!firstName.trim() || !lastName.trim())) return;
    setLoading(true);
    try {
      await crmAPI.createCustomer({
        customer_type: customerType,
        company_name: customerType === "company" ? companyName : undefined,
        first_name: firstName || (customerType === "company" ? companyName : ""),
        last_name: lastName || (customerType === "company" ? "" : ""),
        email: email || undefined,
        phone: phone || undefined,
      } as Partial<Customer>);
      onCreated();
    } catch { /* */ } finally { setLoading(false); }
  };

  const inputClass = "w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Neuer Kunde</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setCustomerType("company")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                customerType === "company"
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "border-surface-200 text-gray-600 hover:bg-surface-50"
              }`}
            >
              <Building size={16} className="inline mr-1.5" />
              Unternehmen
            </button>
            <button
              onClick={() => setCustomerType("individual")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                customerType === "individual"
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "border-surface-200 text-gray-600 hover:bg-surface-50"
              }`}
            >
              <User size={16} className="inline mr-1.5" />
              Privatperson
            </button>
          </div>

          {customerType === "company" && (
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="Firmenname *" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder={customerType === "company" ? "Vorname (optional)" : "Vorname *"} />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder={customerType === "company" ? "Nachname (optional)" : "Nachname *"} />
          </div>

          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="E-Mail" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Telefon" />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg">Abbrechen</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {loading ? "Erstelle..." : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
