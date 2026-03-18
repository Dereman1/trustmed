"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Stethoscope,
  Building2,
  FileText,
  Shield,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAnalytics, type AdminAnalytics } from "@/lib/admin";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function AnalyticsPage() {
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

  const totalUsers = analytics?.users_count ?? 0;
  const patients = analytics?.patients_count ?? 0;
  const providers = analytics?.providers_count ?? 0;
  const facilities = analytics?.facilities_count ?? 0;
  const records = analytics?.medical_records_count ?? 0;
  const permissions = analytics?.access_permissions_count ?? 0;

  const userDistribution = [
    { label: "Patients", value: patients, color: "bg-chart-1", icon: <UserCheck className="h-4 w-4" /> },
    { label: "Providers", value: providers, color: "bg-chart-2", icon: <Stethoscope className="h-4 w-4" /> },
    { label: "Facilities", value: facilities, color: "bg-chart-3", icon: <Building2 className="h-4 w-4" /> },
  ];

  const totalDistribution = patients + providers + facilities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Detailed platform metrics and statistics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medical Records
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{records.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total documents stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Access Permissions
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{permissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active access grants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            User Distribution
          </CardTitle>
          <CardDescription>
            Breakdown of user types in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userDistribution.map((item) => {
              const percentage = totalDistribution > 0 
                ? Math.round((item.value / totalDistribution) * 100) 
                : 0;
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.value.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Records per User Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Key Metrics
          </CardTitle>
          <CardDescription>
            Platform performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">
                {patients > 0 ? (records / patients).toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Records per Patient
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">
                {patients > 0 ? (permissions / patients).toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Permissions per Patient
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">
                {facilities > 0 ? (providers / facilities).toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Providers per Facility
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">
                {providers > 0 ? Math.round(permissions / providers) : "0"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Patients per Provider
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
