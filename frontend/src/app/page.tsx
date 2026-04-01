"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { isDemoMode, forceDemoMode } from "@/lib/demo-mode";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, onboardingComplete, setAuth, setOnboardingComplete } = useAppStore();

  useEffect(() => {
    isDemoMode().then((demo) => {
      if (demo) {
        // Auto-login in demo mode
        forceDemoMode();
        setAuth("demo-tenant", "demo-user");
        router.push("/onboarding");
      } else if (!isAuthenticated) {
        router.push("/auth");
      } else if (!onboardingComplete) {
        router.push("/onboarding");
      } else {
        router.push("/calendar");
      }
    });
  }, [isAuthenticated, onboardingComplete, router, setAuth, setOnboardingComplete]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary-600 text-xl font-semibold">
        Calace wird geladen...
      </div>
    </div>
  );
}
