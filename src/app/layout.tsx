import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crown Advertising | Outdoor and Retail Advertising Pakistan",
  description:
    "Crown Advertising provides indoor, outdoor, retail, B2B, and billboard advertising services across Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${syne.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
