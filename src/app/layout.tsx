'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import useKeyboardShortcuts from "@/config/short-cut/hook/index";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Restaurant POS - Point of Sale System",
//   description: "A modern point of sale system for restaurants",
//   keywords: ["restaurant", "POS", "point of sale", "management"],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalActionHandlers: Record<string, () => void> = {
    "goToTables": () => {
      window.location.href = "/tables";
    },
    "goToOrders": () => {
      window.location.href = "/orders";
    },
    "goToMenu": () => {
      window.location.href = "/menu";
    },
    "goToUsers": () => {
      window.location.href = "/users";
    },
    "goToKitchen": () => {
      window.location.href = "/kitchen";
    },
    "goToPayments": () => {
      window.location.href = "/payments";
    },
  };

  // Activate global shortcuts throughout the application
  useKeyboardShortcuts('global', globalActionHandlers);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
