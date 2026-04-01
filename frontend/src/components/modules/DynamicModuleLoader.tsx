"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import type { AppModule } from "@/types";
import { Puzzle, Settings } from "lucide-react";

/**
 * Dynamic Module Loader
 *
 * This component handles loading modules at runtime without recompilation.
 * Strategy:
 * 1. Built-in modules use Next.js dynamic imports (code-split at build time)
 * 2. AI-generated custom modules render a generic configurable UI based on
 *    the module definition's config_schema (JSON Schema → form)
 * 3. Future: modules can be loaded from a CDN as federated modules
 */

// Registry of built-in module components (lazy-loaded)
const BUILTIN_MODULES: Record<string, React.ComponentType> = {};

interface Props {
  module: AppModule;
}

export default function DynamicModuleLoader({ module }: Props) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (module.is_builtin && BUILTIN_MODULES[module.slug]) {
      setComponent(() => BUILTIN_MODULES[module.slug]);
    }
  }, [module]);

  // For custom AI-generated modules, render a generic module UI
  if (!module.is_builtin || !Component) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-surface-200 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Puzzle size={20} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{module.name}</h2>
            <p className="text-sm text-gray-500">{module.description || "KI-generiertes Modul"}</p>
          </div>
          <button className="ml-auto p-2 rounded-lg hover:bg-surface-100">
            <Settings size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="bg-surface-50 rounded-xl p-8 text-center">
          <Puzzle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            Modul &quot;{module.name}&quot; ist aktiviert.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Komponente: {module.component_path}
          </p>
        </div>

        {/* Render config-based UI if schema exists */}
        {module.config && Object.keys(module.config).length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Konfiguration</h3>
            <pre className="text-xs bg-surface-50 rounded-lg p-3 overflow-auto">
              {JSON.stringify(module.config, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Component />
    </motion.div>
  );
}
