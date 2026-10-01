import type { Metadata, Viewport } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora-font",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope-font",
  display: "swap",
});

// Resolves to the right origin locally, on preview deployments and in production.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const description =
  "Personalized K–12 tutoring across reading, math, spelling, science, and English. Live 1-on-1 sessions, group classes, and recorded lessons with full progress tracking for parents and students.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "JS Tutoring Academy",
  title: {
    default: "JS Tutoring Academy — Personalized K–12 Online Tutoring",
    template: "%s · JS Tutoring Academy",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "JS Tutoring Academy",
    title: "JS Tutoring Academy — Personalized K–12 Online Tutoring",
    description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "JS Tutoring Academy",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1b33",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
