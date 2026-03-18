"use client";

// Admin Dashboard - Platform Overview
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Stethoscope,
  Building2,
  FileText,
  Shield,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAnalytics, type AdminAnalytics } from "@/lib/admin";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await getAnalytics();
        setAnalytics(response.data);
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics?.users_count ?? 0,
      description: "Registered users in the system",
      icon: <Users className="h-4 w-4 text-primary" />,
    },
    {
      title: "Patients",
      value: analytics?.patients_count ?? 0,
      description: "Active patient accounts",
      icon: <UserCheck className="h-4 w-4 text-primary" />,
    },
    {
      title: "Providers",
      value: analytics?.providers_count ?? 0,
      description: "Healthcare providers",
      icon: <Stethoscope className="h-4 w-4 text-primary" />,
    },
    {
      title: "Facilities",
      value: analytics?.facilities_count ?? 0,
      description: "Registered facilities",
      icon: <Building2 className="h-4 w-4 text-primary" />,
    },
    {
      title: "Medical Records",
      value: analytics?.medical_records_count ?? 0,
      description: "Total medical records",
      icon: <FileText className="h-4 w-4 text-primary" />,
    },
    {
      title: "Access Permissions",
      value: analytics?.access_permissions_count ?? 0,
      description: "Active access grants",
      icon: <Shield className="h-4 w-4 text-primary" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of MediLink platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Platform Health
          </CardTitle>
          <CardDescription>
            System status and quick overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">API Status</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Database</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Storage</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">Auth Service</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
