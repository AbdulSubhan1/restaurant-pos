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
    newOrder: () => {
      console.log('Action: Opening New Order Screen (Global)');
      // Implement your actual navigation or modal opening logic here
      // For example: router.push('/new-order');
    },
    searchItems: () => {
      console.log('Action: Opening Search Dialog (Global)');
      // Implement search dialog logic
    },
    printBill: () => {
      console.log('Action: Printing Bill (Global)');
      // Implement print logic
    },
    finalizeSale: () => {
      console.log('Action: Finalizing Sale (Global)');
      // Implement payment process initiation
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
