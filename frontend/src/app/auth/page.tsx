"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/services/api";
import { useAppStore } from "@/store";
import { isDemoModeSync, forceDemoMode } from "@/lib/demo-mode";

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const [isRegister, setIsRegister] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    tenant_name: "",
  });

  const handleDemo = () => {
    forceDemoMode();
    setAuth("demo-tenant", "demo-user");
    router.push("/onboarding");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (isRegister) {
        result = await authAPI.register(form);
      } else {
        result = await authAPI.login(form.email, form.password);
      }

      localStorage.setItem("calace_token", result.access_token);
      localStorage.setItem("calace_tenant_id", result.tenant_id);
      localStorage.setItem("calace_user_id", result.user_id);
      setAuth(result.tenant_id, result.user_id);
      router.push("/onboarding");
    } catch {
      setError(isRegister ? "Registrierung fehlgeschlagen" : "Ungültige Anmeldedaten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-800 mb-2">Calace</h1>
          <p className="text-gray-500">KI-Adaptive Business Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-surface-200 p-8">
          {/* Demo Button */}
          <button
            onClick={handleDemo}
            className="w-full py-3 mb-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl hover:from-primary-600 hover:to-primary-800 transition-all font-medium text-lg shadow-md"
          >
            Demo starten (ohne Registrierung)
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">oder</span>
            </div>
          </div>

          <div className="flex mb-6 bg-surface-50 rounded-lg p-1">
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isRegister ? "bg-white shadow-sm text-primary-700" : "text-gray-500"
              }`}
            >
              Registrieren
            </button>
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isRegister ? "bg-white shadow-sm text-primary-700" : "text-gray-500"
              }`}
            >
              Anmelden
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ihr Name"
                  className="w-full px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
                  required
                />
                <input
                  value={form.tenant_name}
                  onChange={(e) => setForm({ ...form, tenant_name: e.target.value })}
                  placeholder="Firmenname"
                  className="w-full px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
                  required
                />
              </>
            )}
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="E-Mail"
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Passwort"
              className="w-full px-4 py-2.5 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
              required
              minLength={8}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? "Bitte warten..." : isRegister ? "Konto erstellen" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
