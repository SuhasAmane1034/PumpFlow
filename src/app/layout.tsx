import type { Metadata, Viewport } from "next";
import { StoreProvider } from "@/context/store-context";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PumpFlow – Submersible Pump Dealer Management System",
  description: "Complete dealership management system for submersible pumps, motors, cables, billing, and outstanding recovery in Solapur, Maharashtra",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0284c7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PumpFlow" />
      </head>
      <body className="antialiased font-sans bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
        <StoreProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" closeButton />
        </StoreProvider>
      </body>
    </html>
  );
}
