"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { logoutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Loader } from "lucide-react";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";

export function FixedNavbar() {
  const router = useRouter();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (!accessToken || !refreshToken) throw new Error("Missing tokens");
      await logoutUser(accessToken, refreshToken);
      clearSession();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
      clearSession();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 right-0 left-0 h-16 bg-background border-b border-border z-40">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-end">
        {/* Right side - Notifications and Logout */}
        <div className="flex items-center gap-1 sm:gap-3">
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            {loggingOut ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
