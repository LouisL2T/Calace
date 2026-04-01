import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calace – KI-Adaptive Business Platform",
  description: "Intelligente Kalender- und Business-App, die sich an Ihre Branche anpasst.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-surface-50">{children}</body>
    </html>
  );
}
