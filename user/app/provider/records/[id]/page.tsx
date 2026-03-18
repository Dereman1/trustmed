"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  getRecord,
  listRecordDocuments,
  uploadRecordDocument,
  type MedicalRecord,
  type RecordDocument,
} from "@/lib/records";
import {
  getNotesByRecordId,
  addNote,
  type ConsultationNote,
} from "@/lib/notes";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, StickyNote, Upload, Send, Calendar, ExternalLink } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProviderRecordDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const patientId = searchParams.get("patientId") ?? "";
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [documents, setDocuments] = useState<RecordDocument[]>([]);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docDescription, setDocDescription] = useState("");

  const load = () => {
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
        toast.error(extractApiErrorMessage(e));
        setRecord(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await addNote(id, noteText.trim());
      setNoteText("");
      const updated = await getNotesByRecordId(id);
      setNotes(updated);
      toast.success("Note added");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setAddingNote(false);
    }
  };

  const handleUploadDoc = async () => {
    const file = docFileRef.current?.files?.[0];
    if (!file) {
      toast.error("Select a file");
      return;
    }
    setUploadingDoc(true);
    try {
      await uploadRecordDocument(id, file, docDescription || undefined);
      setUploadDocOpen(false);
      setDocDescription("");
      docFileRef.current!.value = "";
      const docs = await listRecordDocuments(id);
      setDocuments(docs);
      toast.success("Document uploaded");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen w-full bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading record…</p>
        </div>
      </MainLayout>
    );
  }
  if (!record) {
    return (
      <MainLayout>
        <div className="min-h-screen w-full bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
            <p className="text-destructive font-medium">Record not found.</p>
            <Button variant="outline" asChild>
              <Link href={patientId ? `/provider/patients/${patientId}/records` : "/provider/patients"}>
                <ArrowLeft className="size-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
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
              <Link
                href={
                  patientId
                    ? `/provider/patients/${patientId}/records`
                    : "/provider/patients"
                }
              >
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {record.record_type}
              </h1>
              {record.uploaded_at && (
                <p className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Calendar className="size-3" />
                  {new Date(record.uploaded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Record Info Card */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Record details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                <p className="text-foreground font-semibold">{record.record_type}</p>
              </div>
              {record.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground">{record.description}</p>
                </div>
              )}
              {record.file_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Original file</p>
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <a
                      href={record.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                      Open file
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card>
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Documents
              </CardTitle>
              <Button size="sm" onClick={() => setUploadDocOpen(true)} className="gap-2">
                <Upload className="size-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="size-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground mb-1">No additional documents.</p>
                  <p className="text-xs text-muted-foreground">Upload documents related to this record.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <a
                      key={d.id}
                      href={d.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary truncate">
                          {d.description || "Document"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(d.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary ml-2 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

      <Dialog open={uploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={docFileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="text-sm"
              required
            />
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder="Brief description"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDocOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDoc} disabled={uploadingDoc}>
              {uploadingDoc ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          {/* Notes Card */}
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="size-5 text-primary" />
                Consultation notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="text-sm"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={addingNote || !noteText.trim()} 
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <StickyNote className="size-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">No notes yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div 
                      key={n.id} 
                      className="p-3 bg-muted/30 border border-border rounded-lg"
                    >
                      <p className="text-sm text-foreground leading-relaxed">{n.note_text}</p>
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
