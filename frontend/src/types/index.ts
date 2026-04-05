// Auth
export interface AuthTokens {
  access_token: string;
  token_type: string;
  tenant_id: string;
  user_id: string;
}

// Calendar
export interface Appointment {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  project_id: string | null;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  sachverstaendiger: string | null;
  ansprechpartner: string | null;
  color: string | null;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// CRM
export interface Customer {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string | null;
  model: string | null;
  year: string | null;
  license_plate: string | null;
  vin: string | null;
  color: string | null;
  extra_data: Record<string, unknown> | null;
}

// Modules
export interface AppModule {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  component_path: string;
  config: Record<string, unknown> | null;
  is_builtin: boolean;
}

// AI
export interface OnboardingResponse {
  reply: string;
  modules_activated: string[];
  industry_detected: string | null;
  onboarding_complete: boolean;
  dynamic_fields_added: Record<string, unknown>[] | null;
}

export interface ModuleExpandResponse {
  reply: string;
  module_slug: string | null;
  module_name: string | null;
  module_activated: boolean;
  component_path: string | null;
}

// Business
export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  appointment_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string | null;
}

export interface MaterialItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity_in_stock: number;
  min_stock_level: number;
  unit: string;
  unit_price: number | null;
  category: string | null;
}

// Chat messages
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  modules_activated?: string[];
  module_activated?: boolean;
  module_name?: string;
}
