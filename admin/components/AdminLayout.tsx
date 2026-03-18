"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getRoleFromUser } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";
import { FixedNavbar } from "./FixedNavbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, isHydrated, accessToken } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken || !user) {
      router.push("/login");
      return;
    }

    const role = getRoleFromUser(user);
    if (role !== "admin") {
      router.push("/login");
    }
  }, [isHydrated, accessToken, user, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <FixedNavbar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-20 lg:pt-24 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
