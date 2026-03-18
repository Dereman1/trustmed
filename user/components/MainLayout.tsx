"use client";

import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { FixedNavbar } from "./FixedNavbar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

function SidebarFallback() {
  return (
    <div className="hidden lg:block w-64 flex-shrink-0 bg-card border-r border-border" />
  );
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <>
      <FixedNavbar />
      <div className="flex min-h-screen bg-background pt-16" suppressHydrationWarning>
        {/* Desktop Sidebar - creates space on lg+ screens */}
        <div className="hidden lg:block w-64 flex-shrink-0" />

        {/* Mobile Navigation Trigger - visible on smaller screens */}
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar />
        </Suspense>

        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 w-full",
            "lg:ml-0",
            className
          )}
        >
          {/* Mobile/Tablet padding for sheet trigger */}
          <div className="lg:hidden h-0" />

          {/* Content */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
