import axios from "axios";
import type {
  AuthTokens,
  Appointment,
  Customer,
  Vehicle,
  Location,
  ContactPerson,
  AppModule,
  OnboardingResponse,
  ModuleExpandResponse,
  TimeEntry,
  Invoice,
  MaterialItem,
  PaginatedOrderResponse,
  OrderSearchParams,
  TeamMember,
} from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` 
  : "/api/v1";

const api = axios.create({ baseURL });

// Inject auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("calace_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; tenant_name: string }) =>
    api.post<AuthTokens>("/auth/register", data).then((r) => r.data),
  login: (email: string, password: string) =>
    api.post<AuthTokens>("/auth/login", { email, password }).then((r) => r.data),
};

// --- Calendar ---
export const calendarAPI = {
  list: (params?: { start?: string; end?: string; status?: string; priority?: string; assigned_to?: string }) =>
    api.get<Appointment[]>("/calendar/appointments", { params }).then((r) => r.data),
  create: (data: Partial<Appointment> & { assigned_to_ids?: string[] }) =>
    api.post<Appointment>("/calendar/appointments", data).then((r) => r.data),
  update: (id: string, data: Partial<Appointment> & { assigned_to_ids?: string[] }) =>
    api.put<Appointment>(`/calendar/appointments/${id}`, data).then((r) => r.data),
  move: (id: string, start_time: string, end_time: string) =>
    api.patch<Appointment>(`/calendar/appointments/${id}/move`, { start_time, end_time }).then((r) => r.data),
  delete: (id: string) => api.delete(`/calendar/appointments/${id}`),
  listTeamMembers: () =>
    api.get<TeamMember[]>("/calendar/team-members").then((r) => r.data),
};

// --- CRM ---
export const crmAPI = {
  // Customers
  listCustomers: (search?: string, customer_type?: string) =>
    api.get<Customer[]>("/crm/customers", { params: { search, customer_type } }).then((r) => r.data),
  createCustomer: (data: Partial<Customer>) =>
    api.post<Customer>("/crm/customers", data).then((r) => r.data),
  getCustomer: (id: string) =>
    api.get<Customer>(`/crm/customers/${id}`).then((r) => r.data),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    api.put<Customer>(`/crm/customers/${id}`, data).then((r) => r.data),
  deleteCustomer: (id: string) =>
    api.delete(`/crm/customers/${id}`),

  // Locations
  listLocations: (customerId: string) =>
    api.get<Location[]>(`/crm/customers/${customerId}/locations`).then((r) => r.data),
  createLocation: (data: { customer_id: string; name: string; street?: string; zip_code?: string; city?: string; phone?: string; email?: string }) =>
    api.post<Location>("/crm/locations", data).then((r) => r.data),
  updateLocation: (id: string, data: Partial<Location>) =>
    api.put<Location>(`/crm/locations/${id}`, data).then((r) => r.data),
  deleteLocation: (id: string) =>
    api.delete(`/crm/locations/${id}`),

  // Contact Persons
  listContacts: (locationId: string) =>
    api.get<ContactPerson[]>(`/crm/locations/${locationId}/contacts`).then((r) => r.data),
  createContact: (data: { location_id: string; first_name: string; last_name: string; role?: string; phone?: string; mobile?: string; email?: string; is_primary?: boolean }) =>
    api.post<ContactPerson>("/crm/contacts", data).then((r) => r.data),
  updateContact: (id: string, data: Partial<ContactPerson>) =>
    api.put<ContactPerson>(`/crm/contacts/${id}`, data).then((r) => r.data),
  deleteContact: (id: string) =>
    api.delete(`/crm/contacts/${id}`),

  // Vehicles
  listVehicles: (customerId?: string, search?: string) =>
    api.get<Vehicle[]>("/crm/vehicles", { params: { customer_id: customerId, search } }).then((r) => r.data),
  createVehicle: (data: Partial<Vehicle>) =>
    api.post<Vehicle>("/crm/vehicles", data).then((r) => r.data),
  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    api.put<Vehicle>(`/crm/vehicles/${id}`, data).then((r) => r.data),
  deleteVehicle: (id: string) =>
    api.delete(`/crm/vehicles/${id}`),
};

// --- Orders ---
export const ordersAPI = {
  search: (params: OrderSearchParams) =>
    api.get<PaginatedOrderResponse>("/orders/search", { params }).then((r) => r.data),
};

// --- AI ---
export const aiAPI = {
  onboarding: (message: string) =>
    api.post<OnboardingResponse>("/ai/onboarding", { message }).then((r) => r.data),
  expandModule: (prompt: string) =>
    api.post<ModuleExpandResponse>("/ai/expand-module", { prompt }).then((r) => r.data),
};

// --- Modules ---
export const modulesAPI = {
  getActive: () => api.get<AppModule[]>("/modules/active").then((r) => r.data),
};

// --- Business ---
export const businessAPI = {
  startTimer: (data: { project_id?: string; description?: string }) =>
    api.post<TimeEntry>("/business/time/start", data).then((r) => r.data),
  stopTimer: (id: string) =>
    api.post<TimeEntry>(`/business/time/${id}/stop`).then((r) => r.data),
  listTimeEntries: () =>
    api.get<TimeEntry[]>("/business/time").then((r) => r.data),
  createInvoice: (data: unknown) =>
    api.post<Invoice>("/business/invoices", data).then((r) => r.data),
  listInvoices: () =>
    api.get<Invoice[]>("/business/invoices").then((r) => r.data),
  listMaterials: () =>
    api.get<MaterialItem[]>("/business/materials").then((r) => r.data),
  createMaterial: (data: Partial<MaterialItem>) =>
    api.post<MaterialItem>("/business/materials", data).then((r) => r.data),
};

// --- Communication ---
export const commAPI = {
  sendSMS: (recipient: string, message: string, customerId?: string) =>
    api.post("/communication/sms/send", { recipient, message, customer_id: customerId }),
  sendWhatsApp: (recipient: string, message: string, customerId?: string) =>
    api.post("/communication/whatsapp/send", { recipient, message, customer_id: customerId }),
  sendReminder: (appointmentId: string, channel: string = "sms") =>
    api.post("/communication/reminder", { appointment_id: appointmentId, channel }),
};

export default api;
