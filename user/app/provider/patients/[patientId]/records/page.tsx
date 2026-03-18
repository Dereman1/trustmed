"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listRecordsForPatient, type MedicalRecord } from "@/lib/records";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, Eye } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function ProviderPatientRecordsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    listRecordsForPatient(patientId)
      .then(setRecords)
      .catch((e) => {
        toast.error(extractApiErrorMessage(e));
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1" asChild>
              <Link href="/provider/patients">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Patient records</h1>
              <p className="text-muted-foreground text-sm mt-1 font-mono">
                {patientId.slice(0, 12)}...
              </p>
            </div>
          </div>

          {/* Records Card */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                All records
                {records.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    {records.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading records...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="size-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No records available.</p>
                  <p className="text-xs text-muted-foreground">Patient may not have uploaded any records yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
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
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto gap-2">
                        <Link href={`/provider/records/${r.id}?patientId=${patientId}`}>
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
