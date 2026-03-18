"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { logoutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Stethoscope,
  Users,
  ScrollText,
  BarChart3,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Facilities",
    href: "/facilities",
    icon: <Building2 className="size-4" />,
  },
  {
    label: "Providers",
    href: "/providers",
    icon: <Stethoscope className="size-4" />,
  },
  {
    label: "Users",
    href: "/users",
    icon: <Users className="size-4" />,
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: <ScrollText className="size-4" />,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="size-4" />,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession, accessToken, refreshToken } = useAuthStore();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) {
        await logoutUser(accessToken, refreshToken);
      }
      clearSession();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      clearSession();
      router.push("/login");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MediLink</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.fullName || user?.email || "Administrator"}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {user?.role || "admin"}
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive(item.href) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10 hover:text-primary",
              )}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border z-40">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Sheet Navigation */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
