"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingChat from "@/components/chat/OnboardingChat";
import { useAppStore } from "@/store";

export default function OnboardingPage() {
  const router = useRouter();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (onboardingComplete) {
      router.push("/calendar");
    }
  }, [onboardingComplete, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">
            Calace Setup
          </h1>
          <p className="text-gray-500 mt-2">
            Ihr KI-Assistent richtet die App für Ihre Branche ein
          </p>
        </div>

        {/* Chat */}
        <OnboardingChat />
      </div>
    </div>
  );
}
