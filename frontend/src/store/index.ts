import { create } from "zustand";
import type {
  AppModule,
  ChatMessage,
  Appointment,
  CalendarView,
  AppointmentStatus,
  AppointmentPriority,
  TeamMember,
  Customer,
} from "@/types";

// ─── Calendar Slice ──────────────────────────────────────────────────────────

interface CalendarFilters {
  status: AppointmentStatus | "";
  priority: AppointmentPriority | "";
  assigneeId: string;
  searchText: string;
}

interface CalendarState {
  appointments: Appointment[];
  currentDate: Date;
  currentView: CalendarView;
  filters: CalendarFilters;
  teamMembers: TeamMember[];
  customers: Customer[];
  isLoading: boolean;

  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (id: string) => void;
  setCurrentDate: (date: Date) => void;
  setCurrentView: (view: CalendarView) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  resetFilters: () => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setIsLoading: (loading: boolean) => void;

  // Derived – computed inline, not stored
  getFilteredAppointments: () => Appointment[];
}

const DEFAULT_FILTERS: CalendarFilters = {
  status: "",
  priority: "",
  assigneeId: "",
  searchText: "",
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  appointments: [],
  currentDate: new Date(),
  currentView: "week",
  filters: { ...DEFAULT_FILTERS },
  teamMembers: [],
  customers: [],
  isLoading: false,

  setAppointments: (appointments) => set({ appointments }),
  addAppointment: (appointment) =>
    set((s) => ({ appointments: [...s.appointments, appointment] })),
  updateAppointment: (appointment) =>
    set((s) => ({
      appointments: s.appointments.map((a) =>
        a.id === appointment.id ? appointment : a
      ),
    })),
  removeAppointment: (id) =>
    set((s) => ({
      appointments: s.appointments.filter((a) => a.id !== id),
    })),
  setCurrentDate: (date) => set({ currentDate: date }),
  setCurrentView: (view) => set({ currentView: view }),
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  setTeamMembers: (members) => set({ teamMembers: members }),
  setCustomers: (customers) => set({ customers }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  getFilteredAppointments: () => {
    const { appointments, filters } = get();
    let result = appointments;

    if (filters.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((a) => a.priority === filters.priority);
    }
    if (filters.assigneeId) {
      result = result.filter(
        (a) =>
          a.assigned_to_ids?.includes(filters.assigneeId) ||
          a.assigned_to === filters.assigneeId
      );
    }
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.order_number?.toLowerCase().includes(q) ||
          a.location_text?.toLowerCase().includes(q) ||
          a.assigned_to_names?.some((n) => n.toLowerCase().includes(q))
      );
    }

    return result;
  },
}));

// ─── App Store (unchanged) ───────────────────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean;
  tenantId: string | null;
  userId: string | null;
  setAuth: (tenantId: string, userId: string) => void;
  logout: () => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Active modules
  activeModules: AppModule[];
  setActiveModules: (modules: AppModule[]) => void;
  addModule: (module: AppModule) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  expandingModule: string | null;
  setExpandingModule: (slug: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: typeof window !== "undefined" && !!localStorage.getItem("calace_token"),
  tenantId: typeof window !== "undefined" ? localStorage.getItem("calace_tenant_id") : null,
  userId: typeof window !== "undefined" ? localStorage.getItem("calace_user_id") : null,

  setAuth: (tenantId, userId) => {
    set({ isAuthenticated: true, tenantId, userId });
  },
  logout: () => {
    localStorage.removeItem("calace_token");
    localStorage.removeItem("calace_tenant_id");
    localStorage.removeItem("calace_user_id");
    set({ isAuthenticated: false, tenantId: null, userId: null });
  },

  onboardingComplete: typeof window !== "undefined" && localStorage.getItem("calace_onboarding_complete") === "true",
  setOnboardingComplete: (complete) => {
    if (complete) {
      localStorage.setItem("calace_onboarding_complete", "true");
    } else {
      localStorage.removeItem("calace_onboarding_complete");
    }
    set({ onboardingComplete: complete });
  },

  activeModules: [],
  setActiveModules: (modules) => set({ activeModules: modules }),
  addModule: (module) =>
    set((state) => ({
      activeModules: [...state.activeModules, module],
      expandingModule: module.slug,
    })),

  chatMessages: typeof window !== "undefined" && localStorage.getItem("calace_chat_history")
    ? JSON.parse(localStorage.getItem("calace_chat_history")!)
    : [],
  addChatMessage: (msg) => set((state) => {
    const newMessages = [...state.chatMessages, msg];
    localStorage.setItem("calace_chat_history", JSON.stringify(newMessages));
    return { chatMessages: newMessages };
  }),
  clearChat: () => {
    localStorage.removeItem("calace_chat_history");
    set({ chatMessages: [] });
  },

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  expandingModule: null,
  setExpandingModule: (slug) => set({ expandingModule: slug }),
}));
