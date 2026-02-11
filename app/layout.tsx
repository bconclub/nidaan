import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nidaan AI — Voice-First Health Triage for India",
  description:
    "Speak your symptoms in any Indian language. Get instant clinical triage, severity assessment, and nearest doctor — all on WhatsApp. Powered by Sarvam AI and Claude.",
  openGraph: {
    title: "Nidaan AI — Voice-First Health Triage for India",
    description:
      "Speak your symptoms in any Indian language. Get instant clinical triage. Find the nearest doctor. All on WhatsApp.",
    url: "https://nidaanai.vercel.app",
    siteName: "Nidaan AI",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nidaan AI — Voice-First Health Triage for India",
    description:
      "Speak your symptoms in any Indian language. Get instant clinical triage. Find the nearest doctor. All on WhatsApp.",
  },
  metadataBase: new URL("https://nidaanai.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
