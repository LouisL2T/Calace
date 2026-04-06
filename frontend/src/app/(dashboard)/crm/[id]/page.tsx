"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { crmAPI, ordersAPI } from "@/services/api";
import type { Customer, Location, ContactPerson, Vehicle, OrderListItem } from "@/types";
import {
  ArrowLeft,
  Building,
  MapPin,
  User,
  Phone,
  Mail,
  Plus,
  Pencil,
  Trash2,
  Car,
  FileText,
  X,
  Smartphone,
} from "lucide-react";

type Tab = "locations" | "vehicles" | "orders";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("locations");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState<string | null>(null); // locationId
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, l, v, o] = await Promise.all([
        crmAPI.getCustomer(customerId),
        crmAPI.listLocations(customerId),
        crmAPI.listVehicles(customerId),
        ordersAPI.search({ customer_id: customerId, page_size: 50 }),
      ]);
      setCustomer(c);
      setLocations(l);
      setVehicles(v);
      setOrders(o.items);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-32">
        <h2 className="text-lg font-medium text-gray-600">Kunde nicht gefunden</h2>
        <button onClick={() => router.push("/crm")} className="mt-4 text-primary-600 hover:underline">
          ← Zurück zur Kundenliste
        </button>
      </div>
    );
  }

  const customerDisplay = customer.company_name || customer.company || `${customer.first_name} ${customer.last_name}`;

  const tabs = [
    { key: "locations" as Tab, label: "Standorte", count: locations.length, icon: <MapPin size={16} /> },
    { key: "vehicles" as Tab, label: "Fahrzeuge", count: vehicles.length, icon: <Car size={16} /> },
    { key: "orders" as Tab, label: "Aufträge", count: orders.length, icon: <FileText size={16} /> },
  ];

  return (
    <div>
      {/* Back & header */}
      <button
        onClick={() => router.push("/crm")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
            {customer.customer_type === "company" ? (
              <Building size={24} className="text-primary-600" />
            ) : (
              <User size={24} className="text-primary-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customerDisplay}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
              <span className="capitalize">{customer.customer_type === "company" ? "Unternehmen" : "Privatperson"}</span>
              <span>·</span>
              <span>{locations.length} Standorte</span>
              <span>·</span>
              <span>{orders.length} Aufträge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info bar */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
        {customer.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={14} className="text-gray-400" />
            {customer.phone}
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-1.5">
            <Mail size={14} className="text-gray-400" />
            {customer.email}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-surface-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === t.key ? "bg-primary-100 text-primary-700" : "bg-surface-100 text-gray-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "locations" && (
        <LocationsTab
          customerId={customerId}
          locations={locations}
          onRefresh={loadData}
          showLocationModal={showLocationModal}
          setShowLocationModal={setShowLocationModal}
          showContactModal={showContactModal}
          setShowContactModal={setShowContactModal}
        />
      )}
      {activeTab === "vehicles" && (
        <VehiclesTab
          customerId={customerId}
          vehicles={vehicles}
          onRefresh={loadData}
          showModal={showVehicleModal}
          setShowModal={setShowVehicleModal}
        />
      )}
      {activeTab === "orders" && <OrdersTab orders={orders} />}
    </div>
  );
}

// ─── Locations Tab ───────────────────────────────────────────────────────────

function LocationsTab({
  customerId,
  locations,
  onRefresh,
  showLocationModal,
  setShowLocationModal,
  showContactModal,
  setShowContactModal,
}: {
  customerId: string;
  locations: Location[];
  onRefresh: () => void;
  showLocationModal: boolean;
  setShowLocationModal: (v: boolean) => void;
  showContactModal: string | null;
  setShowContactModal: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Standorte / Filialen</h2>
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Standort hinzufügen
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-200">
          <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-600">Noch keine Standorte</h3>
          <p className="text-sm text-gray-400 mt-1">Fügen Sie den ersten Standort hinzu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-primary-600" />
                    {loc.name}
                  </h3>
                  {(loc.street || loc.city) && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[loc.street, [loc.zip_code, loc.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    {loc.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {loc.phone}
                      </span>
                    )}
                    {loc.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {loc.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => crmAPI.deleteLocation(loc.id).then(onRefresh)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Contact persons */}
              <div className="border-t border-surface-100 pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ansprechpartner</span>
                  <button
                    onClick={() => setShowContactModal(loc.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Hinzufügen
                  </button>
                </div>
                {loc.contact_persons.length === 0 ? (
                  <p className="text-sm text-gray-400">Keine Ansprechpartner</p>
                ) : (
                  <div className="space-y-2">
                    {loc.contact_persons.map((cp) => (
                      <div key={cp.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User size={14} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {cp.first_name} {cp.last_name}
                              {cp.is_primary && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                                  Haupt
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {cp.role && <span>{cp.role}</span>}
                              {cp.phone && (
                                <span className="flex items-center gap-0.5">
                                  <Phone size={10} /> {cp.phone}
                                </span>
                              )}
                              {cp.mobile && (
                                <span className="flex items-center gap-0.5">
                                  <Smartphone size={10} /> {cp.mobile}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => crmAPI.deleteContact(cp.id).then(onRefresh)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <LocationCreateModal
          customerId={customerId}
          onClose={() => setShowLocationModal(false)}
          onCreated={() => { setShowLocationModal(false); onRefresh(); }}
        />
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactCreateModal
          locationId={showContactModal}
          onClose={() => setShowContactModal(null)}
          onCreated={() => { setShowContactModal(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Vehicles Tab ────────────────────────────────────────────────────────────

function VehiclesTab({
  customerId,
  vehicles,
  onRefresh,
  showModal,
  setShowModal,
}: {
  customerId: string;
  vehicles: Vehicle[];
  onRefresh: () => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Fahrzeuge</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Fahrzeug hinzufügen
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-surface-200">
          <Car size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-medium text-gray-600">Noch keine Fahrzeuge</h3>
          <p className="text-sm text-gray-400 mt-1">Fügen Sie das erste Fahrzeug hinzu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                    <Car size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {[v.make, v.model].filter(Boolean).join(" ") || "Unbekannt"}
                    </h3>
                    {v.year && <p className="text-xs text-gray-500">Baujahr {v.year}</p>}
                  </div>
                </div>
                <button
                  onClick={() => crmAPI.deleteVehicle(v.id).then(onRefresh)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                {v.license_plate && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 text-xs">Kennzeichen</span>
                    <span className="font-mono text-gray-900 bg-surface-50 px-2 py-0.5 rounded">{v.license_plate}</span>
                  </div>
                )}
                {v.vin && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 text-xs">VIN</span>
                    <span className="font-mono text-gray-600 text-xs">{v.vin}</span>
                  </div>
                )}
                {v.color && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 text-xs">Farbe</span>
                    <span className="text-gray-700">{v.color}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VehicleCreateModal
          customerId={customerId}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-gray-50 text-gray-700 border-gray-200",
};

function OrdersTab({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-surface-200">
        <FileText size={40} className="mx-auto text-gray-300 mb-3" />
        <h3 className="font-medium text-gray-600">Noch keine Aufträge</h3>
        <p className="text-sm text-gray-400 mt-1">Erstellen Sie einen Auftrag im Kalender</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-xl border border-surface-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-1.5 h-12 rounded-full shrink-0"
              style={{ backgroundColor: o.color || "#4c6ef5" }}
            />
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{o.title}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                {o.order_number && <span className="font-mono text-primary-600">{o.order_number}</span>}
                <span>
                  {new Date(o.start_time).toLocaleDateString("de-DE")}
                  {o.is_multi_day && ` – ${new Date(o.end_time).toLocaleDateString("de-DE")}`}
                </span>
                {o.vehicle_display && <span>· {o.vehicle_display}</span>}
                {o.license_plate && <span className="font-mono">· {o.license_plate}</span>}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${STATUS_COLORS[o.status] || ""}`}>
            {o.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function LocationCreateModal({ customerId, onClose, onCreated }: { customerId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await crmAPI.createLocation({
        customer_id: customerId,
        name,
        street: street || undefined,
        zip_code: zipCode || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      onCreated();
    } catch { /* */ } finally { setLoading(false); }
  };

  const inputClass = "w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Neuer Standort</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Standortname *" />
          <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} placeholder="Straße" />
          <div className="grid grid-cols-3 gap-3">
            <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputClass} placeholder="PLZ" />
            <input value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} col-span-2`} placeholder="Stadt" />
          </div>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Telefon" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="E-Mail" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg">Abbrechen</button>
          <button onClick={handleSubmit} disabled={loading || !name.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {loading ? "Erstelle..." : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactCreateModal({ locationId, onClose, onCreated }: { locationId: string; onClose: () => void; onCreated: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setLoading(true);
    try {
      await crmAPI.createContact({
        location_id: locationId,
        first_name: firstName,
        last_name: lastName,
        role: role || undefined,
        phone: phone || undefined,
        mobile: mobile || undefined,
        email: email || undefined,
        is_primary: isPrimary,
      });
      onCreated();
    } catch { /* */ } finally { setLoading(false); }
  };

  const inputClass = "w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Neuer Ansprechpartner</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Vorname *" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Nachname *" />
          </div>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} placeholder="Rolle (z.B. Serviceberater)" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="Telefon" />
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} placeholder="Mobilnummer" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="E-Mail" />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded border-surface-200 text-primary-600" />
            Haupt-Ansprechpartner
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-surface-100 rounded-lg">Abbrechen</button>
          <button onClick={handleSubmit} disabled={loading || !firstName.trim() || !lastName.trim()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {loading ? "Erstelle..." : "Erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleCreateModal({ customerId, onClose, onCreated }: { customerId: string; onClose: () => void; onCreated: () => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await crmAPI.createVehicle({
        customer_id: customerId,
        make: make || undefined,
        model: model || undefined,
        year: year || undefined,
        license_plate: plate || undefined,
        vin: vin || undefined,
        color: color || undefined,
      });
      onCreated();
    } catch { /* */ } finally { setLoading(false); }
  };

  const inputClass = "w-full px-3 py-2 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Neues Fahrzeug</h2>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} placeholder="Hersteller" />
            <input value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} placeholder="Modell" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} placeholder="Baujahr" maxLength={4} />
            <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="Farbe" />
          </div>
          <input value={plate} onChange={(e) => setPlate(e.target.value)} className={inputClass} placeholder="Kennzeichen (z.B. S-AB 1234)" />
          <input value={vin} onChange={(e) => setVin(e.target.value)} className={inputClass} placeholder="Fahrgestellnummer (VIN)" maxLength={17} />
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
