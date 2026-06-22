import React from "react";
import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://scamshield-ai-kohl.vercel.app";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: '--font-barlow',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: '--font-barlow-condensed',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: '--font-ibm-plex-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ScamShield AI | Terminal3 Protected Fraud Detection",
    template: "%s | ScamShield AI",
  },
  description:
    "Scan suspicious links, scam messages, QR payment payloads, and uploaded evidence with session-scoped history, Terminal3 proof, and signed audit logs.",
  keywords: ["fraud detection", "phishing scanner", "QR scam detection", "Terminal3", "AI security assistant"],
  applicationName: "ScamShield AI",
  category: "security",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ScamShield AI | Terminal3 Protected Fraud Detection",
    description:
      "A fraud detection assistant for phishing links, fake websites, scam emails, QR payment payloads, and suspicious documents.",
    url: "/",
    siteName: "ScamShield AI",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "ScamShield AI shield icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ScamShield AI | Terminal3 Protected Fraud Detection",
    description:
      "Scan suspicious links, QR payloads, and scam messages with Terminal3-backed audit proof.",
    images: ["/icon.svg"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
