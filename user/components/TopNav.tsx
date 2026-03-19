"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { logoutUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Menu,
  Home,
  FileText,
  Lock,
  Users,
  MessageSquare,
  LogOut,
  Settings,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getPatientNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/patient/dashboard", icon: <Home className="size-4" /> },
    { label: "My Records", href: "/patient/records", icon: <FileText className="size-4" /> },
    { label: "Access Control", href: "/patient/access", icon: <Lock className="size-4" /> },
    { label: "Messages", href: "/patient/messages", icon: <MessageSquare className="size-4" /> },
  ];
}

function getProviderNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/provider/dashboard", icon: <Home className="size-4" /> },
    { label: "Patients", href: "/provider/patients", icon: <Users className="size-4" /> },
    { label: "Messages", href: "/provider/messages", icon: <MessageSquare className="size-4" /> },
    { label: "Change Password", href: "/provider/change-password", icon: <Lock className="size-4" /> },
  ];
}

function getFacilityNavItems(): NavItem[] {
  return [
    { label: "Dashboard", href: "/facility/dashboard", icon: <Home className="size-4" /> },
    { label: "Providers", href: "/facility/providers", icon: <Users className="size-4" /> },
    { label: "Facility Profile", href: "/facility/dashboard?openFacilityProfile=true", icon: <Settings className="size-4" /> },
  ];
}

function getNavItems(role: string | undefined): NavItem[] {
  switch (role) {
    case "patient":
      return getPatientNavItems();
    case "provider":
      return getProviderNavItems();
    case "facility":
      return getFacilityNavItems();
    default:
      return [];
  }
}

/** Bottom tab bar items for mobile (patient: Dashboard, Records, Messages; provider: Dashboard, Patients, Messages) */
function getBottomTabItems(role: string | undefined): NavItem[] {
  if (role === "patient") {
    return [
      { label: "Dashboard", href: "/patient/dashboard", icon: <Home className="size-5" /> },
      { label: "Records", href: "/patient/records", icon: <FileText className="size-5" /> },
      { label: "Messages", href: "/patient/messages", icon: <MessageSquare className="size-5" /> },
    ];
  }
  if (role === "provider") {
    return [
      { label: "Dashboard", href: "/provider/dashboard", icon: <Home className="size-5" /> },
      { label: "Patients", href: "/provider/patients", icon: <Users className="size-5" /> },
      { label: "Messages", href: "/provider/messages", icon: <MessageSquare className="size-5" /> },
    ];
  }
  return [];
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);
  const navItems = getNavItems(user?.role);
  const bottomTabs = getBottomTabItems(user?.role);

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) await logoutUser(accessToken, refreshToken);
      clearSession();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
      clearSession();
      router.push("/login");
    }
  };

  if (!user) return null;

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-foreground",
              isActive(item.href) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
            )}
          >
            {item.icon}
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={user?.role === "patient" ? "/patient/dashboard" : user?.role === "provider" ? "/provider/dashboard" : "/facility/dashboard"} className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold text-primary">TrustMed</span>
          </Link>

          <div className="flex flex-1 items-center justify-center lg:justify-end">
            {desktopNav}
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Profile menu"
                >
                  <UserCircle className="size-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user?.fullName || user?.email}
                  </span>
                  <ChevronDown className="size-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={user?.role === "patient" ? "/patient/dashboard" : user?.role === "provider" ? "/provider/dashboard" : "/facility/dashboard"}>
                    <UserCircle className="size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <div className="flex flex-col gap-4 py-4">
                  <p className="px-4 text-sm font-medium text-muted-foreground">
                    {user?.fullName || user?.email}
                  </p>
                  <nav className="flex flex-col gap-1 px-2">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          {item.icon}
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>
                  <div className="border-t pt-4 mt-auto">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="size-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {bottomTabs.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/20 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 md:hidden"
          aria-label="Bottom navigation"
        >
          {bottomTabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive(item.href) ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
