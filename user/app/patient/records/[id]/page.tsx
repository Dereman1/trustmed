"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getRecord, listRecordDocuments, type MedicalRecord, type RecordDocument } from "@/lib/records";
import { getNotesByRecordId, type ConsultationNote } from "@/lib/notes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, StickyNote, Download, Calendar } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function PatientRecordDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [documents, setDocuments] = useState<RecordDocument[]>([]);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getRecord(id),
      listRecordDocuments(id).catch(() => []),
      getNotesByRecordId(id).catch(() => []),
    ])
      .then(([rec, docs, n]) => {
        setRecord(rec);
        setDocuments(docs);
        setNotes(n);
      })
      .catch((e) => {
        console.error(e);
        setRecord(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading record...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!record) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-destructive font-medium">Record not found.</p>
          <Button variant="outline" asChild>
            <Link href="/patient/records">Back to records</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1" asChild>
              <Link href="/patient/records">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{record.record_type}</h1>
              {record.uploaded_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="size-3.5" />
                  {new Date(record.uploaded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Main Record */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Record Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Type</h3>
                <p className="text-sm text-muted-foreground">{record.record_type}</p>
              </div>
              {record.description && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{record.description}</p>
                </div>
              )}
              {record.file_url && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">File</h3>
                  <a
                    href={record.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Download className="size-4" />
                    Download file
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Attached Documents
                {documents.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    {documents.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="size-10 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No attached documents.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <a
                      key={d.id}
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="size-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:underline truncate">
                            {d.description || "Document"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="w-full sm:w-auto gap-1">
                        <Download className="size-3" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="size-5 text-primary" />
                Provider Notes
                {notes.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                    {notes.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <StickyNote className="size-10 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No notes on this record yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="border-l-2 border-primary bg-muted/50 p-4 rounded-r-lg">
                      <p className="text-sm text-foreground">{n.note_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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
