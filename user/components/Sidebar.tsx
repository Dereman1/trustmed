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
  SheetHeader,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  Home,
  FileText,
  Lock,
  Users,
  MessageSquare,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession, accessToken, refreshToken } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    if (!accessToken || !refreshToken) throw new Error("Missing tokens");
    await logoutUser(accessToken, refreshToken);
    clearSession();
    router.push("/login");
  };

  const patientNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/patient/dashboard",
      icon: <Home className="size-4" />,
    },
    {
      label: "My Records",
      href: "/patient/records",
      icon: <FileText className="size-4" />,
    },
    {
      label: "Access Control",
      href: "/patient/access",
      icon: <Lock className="size-4" />,
    },
    {
      label: "Messages",
      href: "/patient/messages",
      icon: <MessageSquare className="size-4" />,
    },
    {
      label: "Patient Details",
      href: "/patient/dashboard?openPatientDetails=true",
      icon: <FileText className="size-4" />,
    },
  ];

  const providerNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/provider/dashboard",
      icon: <Home className="size-4" />,
    },
    {
      label: "Patients",
      href: "/provider/patients",
      icon: <Users className="size-4" />,
    },
    {
      label: "Messages",
      href: "/provider/messages",
      icon: <MessageSquare className="size-4" />,
    },
    {
      label: "Change Password",
      href: "/provider/change-password",
      icon: <Lock className="size-4" />,
    },
  ];

  const facilityNavItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/facility/dashboard",
      icon: <Home className="size-4" />,
    },
    {
      label: "Providers",
      href: "/facility/providers",
      icon: <Users className="size-4" />,
    },
    {
      label: "Facility Profile",
      href: "/facility/dashboard?openFacilityProfile=true",
      icon: <Settings className="size-4" />,
    },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case "patient":
        return patientNavItems;
      case "provider":
        return providerNavItems;
      case "facility":
        return facilityNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-semibold text-foreground">MediLink</h1>
        <p className="text-xs text-muted-foreground">
          {user?.role === "patient" ? "Patient Portal" : "Provider Portal"}
        </p>
      </div>

      {/* User Info */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.fullName || user?.email}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive(item.href) ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
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
      <div className="border-t border-border p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-foreground hover:bg-muted"
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
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Sheet Navigation */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-40"
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
