"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import OnboardingChat from "@/components/chat/OnboardingChat";
import { ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Calace Setup</h1>
          <p className="text-gray-500 mt-2">
            Ihr KI-Assistent richtet die App für Ihre Branche ein
          </p>
        </div>

        {/* Chat */}
        <OnboardingChat />

        {/* Continue button after onboarding */}
        {onboardingComplete && (
          <div className="text-center mt-6 pb-8">
            <button
              onClick={() => router.push("/calendar")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-lg font-medium shadow-lg"
            >
              Zur App
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
