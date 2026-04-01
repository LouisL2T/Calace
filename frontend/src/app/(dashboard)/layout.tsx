"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useAppStore } from "@/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-16"
        } p-6`}
      >
        {children}
      </main>
    </div>
  );
}
