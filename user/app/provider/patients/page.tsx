"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { listGrantedToMeWithPatientDetails, type AccessPermissionWithPatientDetails } from "@/lib/access";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, ChevronRight, User } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function ProviderPatientsPage() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<AccessPermissionWithPatientDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGrantedToMeWithPatientDetails()
      .then(setPermissions)
      .catch((e) => toast.error(extractApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1" asChild>
              <Link href="/provider/dashboard">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My patients</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Patients who have granted you access to their records
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Total patients</p>
                <p className="text-3xl font-bold text-primary mt-1">{permissions.length}</p>
              </div>
              <Users className="size-12 text-primary opacity-20" />
            </div>
          </div>

          {/* Patients List */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Accessible patients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading patients...</p>
                </div>
              ) : permissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="size-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No patients yet.</p>
                  <p className="text-xs text-muted-foreground mb-4">Request access to patient records from your dashboard.</p>
                  <Button asChild>
                    <Link href="/provider/dashboard">Go to dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {permissions.map((p) => {
                    const patient = p.patient_details;
                    return (
                      <Link
                        key={p.id}
                        href={`/provider/patients/${p.patient_id}/records`}
                        className="block"
                      >
                        <button className="w-full text-left flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group">
                          <div className="bg-primary/10 rounded-lg p-2 mt-0.5 flex-shrink-0">
                            <User className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {patient?.fullName || "Unknown Patient"}
                            </p>
                            {patient?.phone && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {patient.phone}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {patient?.date_of_birth && (
                                <span>
                                  <span className="font-medium">DOB:</span> {new Date(patient.date_of_birth).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                              {patient?.gender && (
                                <span>
                                  <span className="font-medium">Gender:</span> {patient.gender}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Access expires {new Date(p.expires_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                        </button>
                      </Link>
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
