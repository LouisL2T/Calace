"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      router.push("/calendar");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-primary-600 text-xl font-semibold">Calace wird geladen...</div>
    </div>
  );
}
