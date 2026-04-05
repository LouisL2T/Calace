import type { Appointment, Customer, Vehicle, AppModule, TimeEntry, Invoice, MaterialItem } from "@/types";

// ============================================================
// MOCK DATA – vollständige Demo ohne Backend
// ============================================================

const today = new Date();
const d = (daysOffset: number, hour: number, minute = 0) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const dateStr = (daysOffset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    tenant_id: "t1",
    title: "Hagelschaden – BMW 3er",
    description: "Dach + Motorhaube, ca. 40 Dellen",
    customer_id: "c1",
    assigned_to: null,
    project_id: null,
    start_time: d(0, 8, 0),
    end_time: d(0, 10, 30),
    start_date: dateStr(0),
    end_date: dateStr(1),
    sachverstaendiger: "Thomas Schmidt",
    ansprechpartner: "Autohaus Müller GmbH",
    color: "#4c6ef5",
    status: "confirmed",
    metadata: { damage_type: "Hagel", damage_count: 40 },
    created_at: d(-3, 10),
    updated_at: d(-1, 14),
  },
  {
    id: "a2",
    tenant_id: "t1",
    title: "Parkdelle – Audi A4",
    description: "Fahrertür, kleine Delle",
    customer_id: "c2",
    assigned_to: null,
    project_id: null,
    start_time: d(0, 11, 0),
    end_time: d(0, 12, 0),
    start_date: dateStr(0),
    end_date: dateStr(0),
    sachverstaendiger: "Max Weber",
    ansprechpartner: "Privatkunde",
    color: "#51cf66",
    status: "scheduled",
    metadata: { damage_type: "Parkdelle" },
    created_at: d(-2, 9),
    updated_at: d(-2, 9),
  },
  {
    id: "a3",
    tenant_id: "t1",
    title: "Großschaden – Mercedes C-Klasse",
    description: "Komplettinstandsetzung nach Hagelschlag",
    customer_id: "c3",
    assigned_to: null,
    project_id: null,
    start_time: d(0, 13, 0),
    end_time: d(0, 16, 30),
    start_date: dateStr(0),
    end_date: dateStr(3),
    sachverstaendiger: "Klaus Hoffmann",
    ansprechpartner: "Mercedes Zentrum Stuttgart",
    color: "#ff6b6b",
    status: "in_progress",
    metadata: { damage_type: "Hagel", insurance: true },
    created_at: d(-5, 11),
    updated_at: d(0, 8),
  },
  {
    id: "a4",
    tenant_id: "t1",
    title: "Kostenvoranschlag – VW Golf",
    description: "Besichtigung und Kalkulation",
    customer_id: "c4",
    assigned_to: null,
    project_id: null,
    start_time: d(1, 9, 0),
    end_time: d(1, 9, 45),
    start_date: dateStr(1),
    end_date: dateStr(1),
    sachverstaendiger: "Thomas Schmidt",
    ansprechpartner: "VW Autohaus Stern",
    color: "#fcc419",
    status: "scheduled",
    metadata: null,
    created_at: d(-1, 15),
    updated_at: d(-1, 15),
  },
  {
    id: "a5",
    tenant_id: "t1",
    title: "Nachkontrolle – Porsche Cayenne",
    description: "Qualitätskontrolle nach Dellenreparatur",
    customer_id: "c5",
    assigned_to: null,
    project_id: null,
    start_time: d(1, 14, 0),
    end_time: d(1, 14, 30),
    start_date: dateStr(1),
    end_date: dateStr(1),
    sachverstaendiger: "Max Weber",
    ansprechpartner: "Porsche Zentrum Stuttgart",
    color: "#845ef7",
    status: "scheduled",
    metadata: null,
    created_at: d(-1, 10),
    updated_at: d(-1, 10),
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    tenant_id: "t1",
    first_name: "Thomas",
    last_name: "Müller",
    email: "t.mueller@email.de",
    phone: "+49 171 1234567",
    company: "Müller Autoteile GmbH",
    address: "Hauptstr. 42, 70173 Stuttgart",
    custom_fields: { insurance_company: "Allianz", claim_number: "HGL-2026-4821" },
    created_at: d(-30, 10),
  },
  {
    id: "c2",
    tenant_id: "t1",
    first_name: "Sarah",
    last_name: "Weber",
    email: "sarah.weber@gmail.com",
    phone: "+49 152 9876543",
    company: null,
    address: "Blumenweg 7, 70190 Stuttgart",
    custom_fields: null,
    created_at: d(-20, 14),
  },
  {
    id: "c3",
    tenant_id: "t1",
    first_name: "Klaus",
    last_name: "Hoffmann",
    email: "k.hoffmann@hoffmann-bau.de",
    phone: "+49 170 5551234",
    company: "Hoffmann Bau AG",
    address: "Industriestr. 15, 70563 Stuttgart",
    custom_fields: { insurance_company: "HUK-Coburg", claim_number: "HGL-2026-7733" },
    created_at: d(-45, 9),
  },
  {
    id: "c4",
    tenant_id: "t1",
    first_name: "Lisa",
    last_name: "Schneider",
    email: "lisa.s@web.de",
    phone: "+49 176 3334444",
    company: null,
    address: "Rosenstr. 3, 70176 Stuttgart",
    custom_fields: null,
    created_at: d(-10, 16),
  },
  {
    id: "c5",
    tenant_id: "t1",
    first_name: "Michael",
    last_name: "Braun",
    email: "m.braun@porsche-zentrum.de",
    phone: "+49 160 7778888",
    company: "Porsche Zentrum Stuttgart",
    address: "Porschestr. 1, 70435 Stuttgart",
    custom_fields: { fleet_customer: true },
    created_at: d(-60, 11),
  },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: "v1", customer_id: "c1", make: "BMW", model: "320i", year: "2023", license_plate: "S-TM 1234", vin: "WBA12345678901234", color: "Alpinweiß", extra_data: null },
  { id: "v2", customer_id: "c2", make: "Audi", model: "A4 Avant", year: "2022", license_plate: "S-SW 567", vin: null, color: "Navarrablau", extra_data: null },
  { id: "v3", customer_id: "c3", make: "Mercedes-Benz", model: "C 200", year: "2024", license_plate: "S-KH 890", vin: null, color: "Obsidianschwarz", extra_data: null },
  { id: "v4", customer_id: "c4", make: "VW", model: "Golf 8", year: "2021", license_plate: "S-LS 111", vin: null, color: "Mondsteingrau", extra_data: null },
  { id: "v5", customer_id: "c5", make: "Porsche", model: "Cayenne", year: "2025", license_plate: "S-MB 999", vin: null, color: "Carrara Weiß", extra_data: null },
];

export const MOCK_MODULES: AppModule[] = [
  { slug: "calendar", name: "Kalender", description: "Dynamische Terminverwaltung", icon: "calendar", category: "core", component_path: "@/app/calendar", config: null, is_builtin: true },
  { slug: "crm", name: "Kunden", description: "Kundenverwaltung mit Historie", icon: "users", category: "core", component_path: "@/app/crm", config: null, is_builtin: true },
  { slug: "time_tracking", name: "Zeiterfassung", description: "Projektbezogene Stoppuhr", icon: "clock", category: "business", component_path: "@/app/timetracking", config: null, is_builtin: true },
  { slug: "invoicing", name: "Rechnungen", description: "Automatisierte Rechnungserstellung", icon: "file-text", category: "business", component_path: "@/app/invoicing", config: null, is_builtin: true },
  { slug: "damage_documentation", name: "Schadensdokumentation", description: "Fotodokumentation und Schadensbewertung", icon: "camera", category: "industry", component_path: "@/components/modules/damage_documentation", config: null, is_builtin: true },
  { slug: "vehicles", name: "Fahrzeuge", description: "Fahrzeugdatenbank", icon: "car", category: "industry", component_path: "@/components/modules/vehicles", config: null, is_builtin: true },
];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  { id: "te1", user_id: "u1", project_id: null, appointment_id: "a1", description: "Hagelschaden BMW – Dach", start_time: d(-1, 8, 0), end_time: d(-1, 10, 15), duration_seconds: 8100 },
  { id: "te2", user_id: "u1", project_id: null, appointment_id: "a1", description: "Hagelschaden BMW – Motorhaube", start_time: d(-1, 10, 30), end_time: d(-1, 12, 45), duration_seconds: 8100 },
  { id: "te3", user_id: "u1", project_id: null, appointment_id: "a2", description: "Parkdelle Audi – Fahrertür", start_time: d(-2, 14, 0), end_time: d(-2, 15, 0), duration_seconds: 3600 },
  { id: "te4", user_id: "u1", project_id: null, appointment_id: null, description: "Büroarbeit / Angebote", start_time: d(-3, 16, 0), end_time: d(-3, 17, 30), duration_seconds: 5400 },
];

export const MOCK_INVOICES: Invoice[] = [
  { id: "inv1", invoice_number: "INV-202604-0001", customer_id: "c1", status: "paid", subtotal: 1850, tax_rate: 19, tax_amount: 351.50, total: 2201.50, issue_date: d(-15, 10), due_date: d(-1, 10) },
  { id: "inv2", invoice_number: "INV-202604-0002", customer_id: "c3", status: "sent", subtotal: 4200, tax_rate: 19, tax_amount: 798, total: 4998, issue_date: d(-5, 10), due_date: d(9, 10) },
  { id: "inv3", invoice_number: "INV-202604-0003", customer_id: "c2", status: "draft", subtotal: 320, tax_rate: 19, tax_amount: 60.80, total: 380.80, issue_date: d(0, 10), due_date: null },
];

export const MOCK_MATERIALS: MaterialItem[] = [
  { id: "m1", name: "PDR Klebesticks (stark)", description: "Heißklebesticks für Zugadapter", sku: "PDR-KS-001", quantity_in_stock: 145, min_stock_level: 50, unit: "Stück", unit_price: 0.35, category: "Verbrauchsmaterial" },
  { id: "m2", name: "Zugadapter Set (rund)", description: "Verschiedene Größen, 10er Pack", sku: "PDR-ZA-010", quantity_in_stock: 12, min_stock_level: 5, unit: "Set", unit_price: 24.90, category: "Werkzeug" },
  { id: "m3", name: "Isopropanol 99%", description: "Reinigungsalkohol für Oberflächen", sku: "CHM-ISO-001", quantity_in_stock: 3, min_stock_level: 5, unit: "Liter", unit_price: 8.50, category: "Chemie" },
  { id: "m4", name: "Polierpaste (fein)", description: "Endpolitur nach Dellenentfernung", sku: "POL-FP-001", quantity_in_stock: 8, min_stock_level: 3, unit: "Tube", unit_price: 12.90, category: "Politur" },
  { id: "m5", name: "LED Ausbeullampe Streifen", description: "Ersatz-LED-Streifen", sku: "LED-STR-001", quantity_in_stock: 2, min_stock_level: 2, unit: "Stück", unit_price: 45.00, category: "Beleuchtung" },
];

// ============================================================
// Simulated onboarding chat responses
// ============================================================

export const MOCK_ONBOARDING_RESPONSES: Record<string, {
  reply: string;
  modules_activated: string[];
  industry_detected: string | null;
  onboarding_complete: boolean;
}> = {
  default: {
    reply: "Interessant! Können Sie mir mehr erzählen? In welcher Branche sind Sie tätig? Zum Beispiel: Dellendrücker, Lackierer, KFZ-Werkstatt, Handwerker oder allgemeiner Dienstleister?",
    modules_activated: [],
    industry_detected: null,
    onboarding_complete: false,
  },
  dellendruecker: {
    reply: "Perfekt, Sie sind **Dellendrücker**! 🔧\n\nIch habe Ihre App sofort angepasst und folgende Module für Sie aktiviert:\n\n- **Kalender** – Terminverwaltung mit Drag & Drop\n- **Kundenverwaltung** – mit Versicherungsdaten & Schadensnummern\n- **Fahrzeuge** – Fahrzeugdatenbank\n- **Schadensdokumentation** – Fotodokumentation\n- **Zeiterfassung** – Projektbezogene Stoppuhr\n- **Rechnungen** – Automatische Rechnungserstellung\n\nIhre App ist jetzt einsatzbereit! Klicken Sie links im Menü auf **Kalender**, um Ihren ersten Termin zu erstellen.",
    modules_activated: ["calendar", "crm", "vehicles", "damage_documentation", "time_tracking", "invoicing"],
    industry_detected: "dellendruecker",
    onboarding_complete: true,
  },
  lackierer: {
    reply: "Super, Sie sind **Lackierer**! 🎨\n\nIch habe folgende Module aktiviert:\n\n- **Kalender** – Terminverwaltung\n- **Kundenverwaltung** – mit Fahrzeugdaten\n- **Fahrzeuge** – Farbcodes & Varianten\n- **Farbmischung** – Mischverhältnisse\n- **Materialbestand** – Lacke & Verbrauchsmaterial\n- **Rechnungen** – Automatisierte Abrechnung\n\nIhre App ist einsatzbereit!",
    modules_activated: ["calendar", "crm", "vehicles", "color_mixing", "materials", "invoicing"],
    industry_detected: "lackierer",
    onboarding_complete: true,
  },
  werkstatt: {
    reply: "Verstanden, Sie betreiben eine **KFZ-Werkstatt**! 🔩\n\nAktivierte Module:\n\n- **Kalender** – Terminverwaltung\n- **Kundenverwaltung**\n- **Fahrzeuge** – mit Kilometerstand & Servicehistorie\n- **Ersatzteilkatalog**\n- **Materialbestand**\n- **Zeiterfassung**\n- **Rechnungen**\n\nIhre App ist einsatzbereit!",
    modules_activated: ["calendar", "crm", "vehicles", "parts_catalog", "materials", "time_tracking", "invoicing"],
    industry_detected: "werkstatt",
    onboarding_complete: true,
  },
};

/**
 * Match user input to an industry for mock onboarding.
 */
export function getMockOnboardingResponse(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("delle") || lower.includes("pdr") || lower.includes("ausbeul") || lower.includes("hagel")) {
    return MOCK_ONBOARDING_RESPONSES.dellendruecker;
  }
  if (lower.includes("lack") || lower.includes("farb") || lower.includes("spritz")) {
    return MOCK_ONBOARDING_RESPONSES.lackierer;
  }
  if (lower.includes("werkstatt") || lower.includes("kfz") || lower.includes("reparatur") || lower.includes("inspektion")) {
    return MOCK_ONBOARDING_RESPONSES.werkstatt;
  }
  return MOCK_ONBOARDING_RESPONSES.default;
}

/**
 * Simulate module expansion for new tool requests.
 */
export function getMockModuleExpansion(prompt: string): {
  reply: string;
  module_slug: string;
  module_name: string;
  module_activated: boolean;
  component_path: string;
} {
  const lower = prompt.toLowerCase();

  if (lower.includes("farb") || lower.includes("misch")) {
    return {
      reply: "Klar! Ich habe das Modul **Farbmischverhältnisse** für Sie erstellt. Damit können Sie Mischrezepturen speichern und abrufen. 🎨",
      module_slug: "color_mixing",
      module_name: "Farbmischverhältnisse",
      module_activated: true,
      component_path: "@/components/modules/color_mixing",
    };
  }
  if (lower.includes("check") || lower.includes("prüf")) {
    return {
      reply: "Erledigt! Das Modul **Fahrzeug-Checkliste** ist jetzt verfügbar. Erstellen Sie standardisierte Prüflisten für Fahrzeugannahmen. ✅",
      module_slug: "vehicle_checklist",
      module_name: "Fahrzeug-Checkliste",
      module_activated: true,
      component_path: "@/components/modules/vehicle_checklist",
    };
  }
  return {
    reply: `Verstanden! Ich habe ein neues Modul basierend auf Ihrer Anfrage erstellt: **${prompt}**`,
    module_slug: prompt.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    module_name: prompt,
    module_activated: true,
    component_path: `@/components/modules/custom`,
  };
}
