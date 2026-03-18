"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  listMyPermissionsWithProvider,
  grantAccess,
  revokeAccess,
  type AccessPermissionWithProvider,
  listMyPermissions,
} from "@/lib/access";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCheck, UserX, Lock, Check, Clock, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/MainLayout";

export default function PatientAccessPage() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<AccessPermissionWithProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyPermissionsWithProvider()
      .then(setPermissions)
      .catch((e) => toast.error(extractApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleGrant = async (permissionId: string) => {
    try {
      await grantAccess(permissionId);
      await listMyPermissions().then(setPermissions);
      toast.success("Access granted");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const handleRevoke = async (permissionId: string) => {
    try {
      await revokeAccess(permissionId);
      await listMyPermissions().then(setPermissions);
      toast.success("Access revoked");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const grantedCount = permissions.filter(p => p.status === "granted").length;
  const pendingCount = permissions.filter(p => p.status === "pending").length;

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1" asChild>
              <Link href="/patient/dashboard">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Manage access</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Grant or revoke provider access to your medical records
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Granted Access</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{grantedCount}</p>
                  </div>
                  <Check className="size-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{pendingCount}</p>
                  </div>
                  <Clock className="size-8 text-yellow-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Access Permissions */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                Access Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading permissions...</p>
                </div>
              ) : permissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="size-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No access requests yet.</p>
                  <p className="text-xs text-muted-foreground">Providers can request access to your records from their dashboard.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {permissions.map((p) => {
                    const isGranted = p.status === "granted";
                    const isPending = p.status === "pending";
                    const provider = p.provider_details;
                    
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              isGranted
                                ? "default"
                                : isPending
                                  ? "secondary"
                                  : "outline"
                            }
                            className="w-fit"
                          >
                            {isGranted && <Check className="size-3 mr-1" />}
                            {isPending && <Clock className="size-3 mr-1" />}
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Provider Details */}
                        <div className="space-y-3">
                          <div className="flex gap-3 items-start">
                            <div className="bg-primary/10 rounded-lg p-2 mt-1 shrink-0">
                              <Stethoscope className="size-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {provider?.fullName || "Unknown Provider"}
                              </p>
                              {provider?.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {provider.phone}
                                </p>
                              )}
                              {provider?.specialization && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium">Specialty:</span> {provider.specialization}
                                </p>
                              )}
                              {provider?.license_number && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">License:</span> {provider.license_number}
                                </p>
                              )}
                              {provider?.verification_docs && provider.verification_docs.length > 0 && (
                               
                  <div className="space-y-1 pt-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Verification:
                    </p>
                    <div className="flex flex-col gap-1">
                      {provider.verification_docs.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline break-all"
                        >
                          View document {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                            
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground border-t border-border pt-3">
                            Expires {new Date(p.expires_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          {isPending && (
                            <Button
                              size="sm"
                              onClick={() => handleGrant(p.id)}
                              className="flex-1 gap-1"
                            >
                              <UserCheck className="size-4" />
                              Grant
                            </Button>
                          )}
                          {isGranted && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevoke(p.id)}
                              className="flex-1 gap-1"
                            >
                              <UserX className="size-4" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
