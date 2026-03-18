"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { listMyRecords, type MedicalRecord } from "@/lib/records";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Eye } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function PatientRecordsPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyRecords()
      .then(setRecords)
      .catch((e) => toast.error(extractApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My records</h1>
            <p className="text-muted-foreground text-sm">
              {user?.fullName ?? "Patient"} • Manage your medical records
            </p>
          </div>

          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                All records
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading your records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No records yet.</p>
                  <p className="text-xs text-muted-foreground mb-4">Upload your first medical record from your dashboard.</p>
                  <Button asChild>
                    <Link href="/patient/dashboard">Go to dashboard</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {r.record_type}
                        </p>
                        {r.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {r.description}
                          </p>
                        )}
                        {r.uploaded_at && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="size-3" />
                            {new Date(r.uploaded_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <Link href={`/patient/records/${r.id}`} className="gap-2">
                          <Eye className="size-4" />
                          <span>View</span>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
