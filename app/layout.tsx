import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nidaan AI — Multilingual Health Triage",
  description:
    "AI-powered symptom triage for rural India via WhatsApp, with voice support in 10+ Indian languages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-medical-light font-sans">
        {children}
      </body>
    </html>
  );
}
