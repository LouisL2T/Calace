"use client";

import Sidebar from "@/components/ui/Sidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { useAppStore } from "@/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Top-Bar mit NotificationBell */}
      <header
        className={`fixed top-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-end px-4 z-30 transition-all duration-300 ${
          sidebarOpen ? "left-64" : "left-16"
        }`}
      >
        <NotificationBell />
      </header>
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        } pt-14 p-6`}
      >
        {children}
      </main>
    </div>
  );
}
