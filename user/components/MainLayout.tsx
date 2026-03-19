"use client";

import { TopNav } from "./TopNav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <>
      <TopNav />
      <main
        className={cn(
          "min-h-screen w-full bg-[#F8FAFC] pt-14",
          "pb-20 md:pb-0",
          className
        )}
        suppressHydrationWarning
      >
        {children}
      </main>
    </>
  );
}
