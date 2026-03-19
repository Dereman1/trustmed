import type { Metadata } from "next";
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { HydrationGuard } from "@/components/HydrationGuard";
import { AuthApiSync } from "@/components/AuthApiSync";

// Modern heading font - Poppins (friendly, geometric)
const headingFont = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-heading',
  weight: ['400', '500', '600', '700']
});

// Body font - Inter (keep for readability)
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
  title: "TrustMed - Patient-Controlled Digital Health Record Platform",
  description: "TrustMed enables patients to securely store and share their medical records with authorized healthcare providers.",
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