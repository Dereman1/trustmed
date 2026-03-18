import type { Metadata } from "next";
import { Geist_Mono, Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { HydrationGuard } from "@/components/HydrationGuard";
import { AuthApiSync } from "@/components/AuthApiSync";

// Modern heading font - Outfit
const headingFont = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});

// Body font - Inter
const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600']
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediLink - Portable Patient Medical Record Platform",
  description: "MediLink enables patients to securely store, manage, and share their medical records with authorized healthcare providers anytime, anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(headingFont.variable, bodyFont.variable)}>
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
        <HydrationGuard>
          <AuthApiSync />
          {children}
        </HydrationGuard>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}