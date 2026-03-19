import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { HydrationGuard } from "@/components/HydrationGuard";
import { AuthApiSync } from "@/components/AuthApiSync";

// Modern heading font - Poppins (friendly, geometric)
const headingFont = Poppins({ 
  subsets: ["latin"], 
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"]
});

// Body font - Inter
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustMed Admin",
  description: "Admin panel for TrustMed - Medical Records Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(headingFont.variable, inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <HydrationGuard>
          <AuthApiSync />
          {children}
        </HydrationGuard>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}