"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import {
  Calendar,
  Users,
  Clock,
  FileText,
  Package,
  MessageSquare,
  Puzzle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
  Palette,
  Scan,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  calendar: <Calendar size={20} />,
  orders: <ClipboardList size={20} />,
  crm: <Users size={20} />,
  time_tracking: <Clock size={20} />,
  invoicing: <FileText size={20} />,
  materials: <Package size={20} />,
  vehicles: <Users size={20} />,
  puzzle: <Puzzle size={20} />,
  colors: <Palette size={20} />,
  scan: <Scan size={20} />,
};

const BUILTIN_NAV = [
  { slug: "calendar", name: "Kalender", href: "/calendar", icon: "calendar" },
  { slug: "orders", name: "Aufträge", href: "/orders", icon: "orders" },
  { slug: "crm", name: "Kunden", href: "/crm", icon: "crm" },
  { slug: "time_tracking", name: "Zeiterfassung", href: "/timetracking", icon: "time_tracking" },
  { slug: "invoicing", name: "Rechnungen", href: "/invoicing", icon: "invoicing" },
  { slug: "materials", name: "Material", href: "/materials", icon: "materials" },
  { slug: "colors", name: "Farbregeln", href: "/settings/colors", icon: "colors" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, activeModules, expandingModule, logout } = useAppStore();

  const customModules = activeModules.filter(
    (m) => !BUILTIN_NAV.some((b) => b.slug === m.slug)
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-surface-200 transition-all duration-300 z-40 flex flex-col ${
        sidebarOpen ? "w-64" : "w-16"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200">
        {sidebarOpen && (
          <span className="text-xl font-bold text-primary-700">Calace</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-300"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          {sidebarOpen && (
            <span className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
              Module
            </span>
          )}
        </div>

        {BUILTIN_NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-surface-100"
              }`}
            >
              {ICON_MAP[item.icon] || <Puzzle size={20} />}
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Dynamic modules from AI */}
        {customModules.length > 0 && sidebarOpen && (
          <div className="px-3 mt-6 mb-2">
            <span className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
              KI-Module
            </span>
          </div>
        )}

        {customModules.map((mod) => {
          const isNew = expandingModule === mod.slug;
          return (
            <Link
              key={mod.slug}
              href={`/modules/${mod.slug}`}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-surface-100 ${
                isNew ? "animate-module-appear bg-primary-50 ring-2 ring-primary-300" : ""
              }`}
            >
              <Puzzle size={20} />
              {sidebarOpen && <span>{mod.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* UI removed AI prompt shortcut */}

      {/* Logout */}
      <div className="p-3 border-t border-surface-200">
        <button
          onClick={() => {
            logout();
            window.location.href = "/auth";
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm">Abmelden</span>}
        </button>
      </div>
    </aside>
  );
}
