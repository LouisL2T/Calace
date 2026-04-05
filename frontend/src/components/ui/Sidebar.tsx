"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  calendar: <Calendar size={20} />,
  crm: <Users size={20} />,
  time_tracking: <Clock size={20} />,
  invoicing: <FileText size={20} />,
  materials: <Package size={20} />,
  vehicles: <Users size={20} />,
  puzzle: <Puzzle size={20} />,
};

const BUILTIN_NAV = [
  { slug: "calendar", name: "Kalender", href: "/calendar", icon: "calendar" },
  { slug: "crm", name: "Kunden", href: "/crm", icon: "crm" },
  { slug: "time_tracking", name: "Zeiterfassung", href: "/timetracking", icon: "time_tracking" },
  { slug: "invoicing", name: "Rechnungen", href: "/invoicing", icon: "invoicing" },
  { slug: "materials", name: "Material", href: "/materials", icon: "materials" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, activeModules, expandingModule, logout } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const customModules = activeModules.filter(
    (m) => !BUILTIN_NAV.some((b) => b.slug === m.slug)
  );

  const NavContent = ({ showLabels }: { showLabels: boolean }) => (
    <>
      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          {showLabels && (
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-surface-100"
              }`}
            >
              {ICON_MAP[item.icon] || <Puzzle size={20} />}
              {showLabels && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Dynamic modules from AI */}
        {customModules.length > 0 && showLabels && (
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors text-gray-600 hover:bg-surface-100 ${
                isNew ? "animate-module-appear bg-primary-50 ring-2 ring-primary-300" : ""
              }`}
            >
              <Puzzle size={20} />
              {showLabels && <span>{mod.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* AI prompt shortcut */}
      {showLabels && (
        <div className="p-3 border-t border-surface-200">
          <Link
            href="/onboarding"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <MessageSquare size={18} />
            <span className="text-sm font-medium">KI-Assistent</span>
          </Link>
        </div>
      )}

      {/* Logout */}
      <div className="p-3 border-t border-surface-200">
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            logout();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          {showLabels && <span className="text-sm">Abmelden</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-surface-200 z-50 flex items-center justify-between px-4">
        <span className="text-xl font-bold text-primary-700">Calace</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-surface-100 text-gray-600"
          data-testid="mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <aside
        className={`md:hidden fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-surface-200 z-50 transform transition-transform duration-300 flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent showLabels={true} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full bg-white border-r border-surface-200 transition-all duration-300 z-40 flex-col ${
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

        <NavContent showLabels={sidebarOpen} />
      </aside>
    </>
  );
}
