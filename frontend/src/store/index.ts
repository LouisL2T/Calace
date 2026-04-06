import { create } from "zustand";
import type { AppModule, ChatMessage } from "@/types";

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
