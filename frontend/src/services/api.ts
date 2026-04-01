import axios from "axios";
import type {
  AuthTokens,
  Appointment,
  Customer,
  Vehicle,
  AppModule,
  OnboardingResponse,
  ModuleExpandResponse,
  TimeEntry,
  Invoice,
  MaterialItem,
} from "@/types";

const api = axios.create({ baseURL: "/api/v1" });

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
  list: (params?: { start?: string; end?: string }) =>
    api.get<Appointment[]>("/calendar/appointments", { params }).then((r) => r.data),
  create: (data: Partial<Appointment>) =>
    api.post<Appointment>("/calendar/appointments", data).then((r) => r.data),
  update: (id: string, data: Partial<Appointment>) =>
    api.put<Appointment>(`/calendar/appointments/${id}`, data).then((r) => r.data),
  move: (id: string, start_time: string, end_time: string) =>
    api.patch<Appointment>(`/calendar/appointments/${id}/move`, { start_time, end_time }).then((r) => r.data),
  delete: (id: string) => api.delete(`/calendar/appointments/${id}`),
};

// --- CRM ---
export const crmAPI = {
  listCustomers: (search?: string) =>
    api.get<Customer[]>("/crm/customers", { params: { search } }).then((r) => r.data),
  createCustomer: (data: Partial<Customer>) =>
    api.post<Customer>("/crm/customers", data).then((r) => r.data),
  getCustomer: (id: string) =>
    api.get<Customer>(`/crm/customers/${id}`).then((r) => r.data),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    api.put<Customer>(`/crm/customers/${id}`, data).then((r) => r.data),
  listVehicles: (customerId?: string) =>
    api.get<Vehicle[]>("/crm/vehicles", { params: { customer_id: customerId } }).then((r) => r.data),
  createVehicle: (data: Partial<Vehicle>) =>
    api.post<Vehicle>("/crm/vehicles", data).then((r) => r.data),
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
