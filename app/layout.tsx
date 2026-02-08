import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Myanmar } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoMyanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  variable: "--font-myanmar",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LifeOS - AI-Powered Life Management",
  description:
    "Your AI-powered all-in-one life management system. Track tasks, habits, notes, calendar, and goals.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoMyanmar.variable} font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
