// Auth
export interface AuthTokens {
  access_token: string;
  token_type: string;
  tenant_id: string;
  user_id: string;
}

// Calendar
export type AppointmentStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "postponed"
  // Legacy statuses (backward compat)
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "no_show";

export type AppointmentPriority = "low" | "medium" | "high";

export interface Appointment {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  assigned_to_ids: string[];
  assigned_to_names: string[];
  project_id: string | null;
  vehicle_id: string | null;
  location_id: string | null;
  contact_person_id: string | null;
  start_time: string;
  end_time: string;
  is_multi_day: boolean;
  order_number: string | null;
  color: string | null;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  location_text: string | null;
  metadata: Record<string, unknown> | null;
  // Scanner-Operator-Workflow
  needs_scan: boolean;
  scan_notified: boolean;
  scan_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
}

// CRM
export type CustomerType = "company" | "individual";

export interface Customer {
  id: string;
  tenant_id: string;
  customer_type: CustomerType;
  company_name: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
}

export interface Location {
  id: string;
  customer_id: string;
  name: string;
  street: string | null;
  zip_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_persons: ContactPerson[];
  created_at: string;
}

export interface ContactPerson {
  id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  notes: string | null;
  is_primary: boolean;
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

// Orders (flattened view for global list)
export interface OrderListItem {
  id: string;
  title: string;
  order_number: string | null;
  status: AppointmentStatus;
  start_time: string;
  end_time: string;
  is_multi_day: boolean;
  color: string | null;
  description: string | null;
  customer_id: string | null;
  customer_name: string | null;
  location_id: string | null;
  location_name: string | null;
  location_city: string | null;
  contact_person_id: string | null;
  contact_person_name: string | null;
  vehicle_id: string | null;
  vehicle_display: string | null;
  license_plate: string | null;
  vin: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedOrderResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrderSearchParams {
  q?: string;
  customer_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  license_plate?: string;
  vin?: string;
  status?: AppointmentStatus;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
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

// Calendar view types
export type CalendarView = "day" | "week" | "month" | "year" | "list" | "timeline";

// Notifications
export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  appointment_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

// Checklist (Kleine Annahme)
export interface ChecklistPhoto {
  id: string;
  checklist_id: string;
  photo_type: string;
  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface Checklist {
  id: string;
  tenant_id: string;
  appointment_id: string;
  assigned_to: string | null;
  status: "pending" | "in_progress" | "completed";
  mileage: number | null;
  fault_codes: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  photos: ChecklistPhoto[];
}

// Color Rules
export interface ColorRule {
  id: string;
  tenant_id: string;
  label: string;
  color: string;
  rule_type: "employee" | "order_type" | "customer";
  reference_id: string | null;
  created_at: string;
}

// Saved Calendar Views
export interface SavedView {
  id?: string;
  name: string;
  assigned_to?: string;
  customer_id?: string;
  status?: string;
  needs_scan?: boolean;
  view_type?: CalendarView;
  icon?: string;
}

