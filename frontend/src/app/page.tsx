"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else if (!onboardingComplete) {
      router.push("/onboarding");
    } else {
      router.push("/calendar");
    }
  }, [isAuthenticated, onboardingComplete, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary-600 text-xl font-semibold">Calace wird geladen...</div>
    </div>
  );
}
