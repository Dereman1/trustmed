"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { getMyProfile, updateMyProfile, type UserProfile } from "@/lib/profile";
import {
  getMyPatientProfile,
  createPatientProfile,
  updatePatientProfile,
  type PatientProfile,
} from "@/lib/patient";
import { listMyRecords, uploadRecord, type MedicalRecord } from "@/lib/records";
import { listMyPermissions } from "@/lib/access";
import { getMessages } from "@/lib/messages";
import { extractApiErrorMessage } from "@/lib/api";
import { logoutUser } from "@/lib/auth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Calendar,
  Activity,
  User,
  LogOut,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Lock,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MainLayout } from "@/components/MainLayout";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
});

const patientSchema = z.object({
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required").max(50),
});

const recordSchema = z.object({
  record_type: z.string().min(1, "Type is required").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PatientFormValues = z.infer<typeof patientSchema>;
type RecordFormValues = z.infer<typeof recordSchema>;

export default function PatientDashboard() {
  // --- Dashboard card state ---
  const [accessGrantedCount, setAccessGrantedCount] = useState(0);
  const [accessPendingCount, setAccessPendingCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  // --- Profile and record state ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [uploadRecordOpen, setUploadRecordOpen] = useState(false);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const recordFileRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const patientForm = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { date_of_birth: "", gender: "" },
  });

  const recordForm = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: { record_type: "", description: "" },
  });

  const loadRecords = async () => {
    try {
      const list = await listMyRecords();
      setRecords(list);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profileRes, patientRes] = await Promise.all([
        getMyProfile(),
        getMyPatientProfile().catch(() => null),
      ]);
      setProfile(profileRes);
      setPatientProfile(patientRes ?? null);
      profileForm.reset({
        fullName: profileRes.fullName ?? "",
        phone: profileRes.phone ?? "",
      });
      if (patientRes) {
        patientForm.reset({
          date_of_birth: patientRes.date_of_birth ?? "",
          gender: patientRes.gender ?? "",
        });
      }
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (patientProfile) loadRecords();
  }, [patientProfile?.id]);

  useEffect(() => {
    if (searchParams.get("openPatientDetails") === "true") {
      setPatientOpen(true);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) {
        await logoutUser(accessToken, refreshToken);
      }
      clearSession();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
      clearSession();
      router.push("/");
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const updated = await updateMyProfile({
        fullName: values.fullName,
        phone: values.phone || undefined,
      });
      setProfile(updated);
      setProfileOpen(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const onUploadRecordSubmit = async (values: RecordFormValues) => {
    const file = recordFileRef.current?.files?.[0];
    if (!file) {
      toast.error("Select a file");
      return;
    }
    setUploadingRecord(true);
    try {
      await uploadRecord(file, {
        record_type: values.record_type,
        description: values.description || undefined,
      });
      setUploadRecordOpen(false);
      recordForm.reset({ record_type: "", description: "" });
      recordFileRef.current!.value = "";
      await loadRecords();
      toast.success("Record uploaded");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setUploadingRecord(false);
    }
  };

  const onPatientSubmit = async (values: PatientFormValues) => {
    try {
      if (patientProfile) {
        const updated = await updatePatientProfile({
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
        });
        setPatientProfile(updated);
        toast.success("Patient profile updated");
      } else {
        const created = await createPatientProfile({
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
        });
        setPatientProfile(created);
        toast.success("Patient profile created");
      }
      setPatientOpen(false);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const isProfileComplete = Boolean(
    profile?.fullName &&
    patientProfile?.date_of_birth &&
    patientProfile?.gender,
  );

  // --- Dashboard card data loading ---
  useEffect(() => {
    const loadAccessCounts = async () => {
      try {
        const permissions = await listMyPermissions();
        setAccessGrantedCount(
          permissions.filter((p: any) => p.status === "granted").length,
        );
        setAccessPendingCount(
          permissions.filter((p: any) => p.status === "pending").length,
        );
      } catch (e) {
        setAccessGrantedCount(0);
        setAccessPendingCount(0);
      }
    };
    if (user?.id) loadAccessCounts();
  }, [user?.id]);

  useEffect(() => {
    const loadMessagesCount = async () => {
      try {
        const messages = await getMessages({ limit: 100 });
        setMessagesCount(messages.length);
      } catch (e) {
        setMessagesCount(0);
      }
    };
    if (user?.id) loadMessagesCount();
  }, [user?.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background container mx-autop px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
          {!isProfileComplete && (
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Profile incomplete</AlertTitle>
              <AlertDescription>
                Complete your profile and patient details (date of birth and
                gender) to access all features.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Patient Dashboard
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Welcome back, {profile?.fullName || user?.fullName || "Patient"}
              </p>
            </div>
            {/* Dialogs remain but not triggered from header */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update profile</DialogTitle>
                  <DialogDescription>
                    Update your personal information
                  </DialogDescription>
                </DialogHeader>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 234 567 890"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setProfileOpen(false)}
                        disabled={profileForm.formState.isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={profileForm.formState.isSubmitting}
                      >
                        {profileForm.formState.isSubmitting
                          ? "Saving..."
                          : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={patientOpen} onOpenChange={setPatientOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Patient details</DialogTitle>
                  <DialogDescription>
                    Update your date of birth and gender
                  </DialogDescription>
                </DialogHeader>
                <Form {...patientForm}>
                  <form
                    onSubmit={patientForm.handleSubmit(onPatientSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={patientForm.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={field.value || ""}
                            >
                              <option value="">Select gender</option>
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPatientOpen(false)}
                        disabled={patientForm.formState.isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={patientForm.formState.isSubmitting}
                      >
                        {patientForm.formState.isSubmitting
                          ? "Saving..."
                          : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total records card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total records
              </CardTitle>
              <FileText className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {records.length}
              </div>
              <Link
                href="/patient/records"
                className="text-xs text-primary hover:underline inline-block mt-1"
              >
                View all
              </Link>
            </CardContent>
          </Card>

          {/* Grant Access card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Grant Access
              </CardTitle>
              <Lock className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {accessGrantedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Providers with access
              </p>
            </CardContent>
          </Card>

          {/* Pending Request card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pending Request
              </CardTitle>
              <AlertCircle className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {accessPendingCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your approval
              </p>
            </CardContent>
          </Card>

          {/* New messages card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                New messages
              </CardTitle>
              <MessageSquare className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">
                {messagesCount}
              </div>
              <Link
                href="/patient/messages"
                className="text-xs text-primary hover:underline inline-block mt-1"
              >
                View messages
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Removed duplicate dashboard card state and useEffect blocks from render area */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent records</CardTitle>
              <Dialog
                open={uploadRecordOpen}
                onOpenChange={setUploadRecordOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Upload</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload record</DialogTitle>
                    <DialogDescription>
                      Upload a new medical record to your profile
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...recordForm}>
                    <form
                      onSubmit={recordForm.handleSubmit(onUploadRecordSubmit)}
                      className="space-y-4"
                    >
                      <input
                        ref={recordFileRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="text-sm"
                        required
                      />
                      <FormField
                        control={recordForm.control}
                        name="record_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Record type</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Lab results"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recordForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Brief description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUploadRecordOpen(false)}
                          disabled={uploadingRecord}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={uploadingRecord}>
                          {uploadingRecord ? "Uploading…" : "Upload"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No records yet. Upload one above.
                </p>
              ) : (
                <div className="space-y-2">
                  {records.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {r.record_type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.uploaded_at
                            ? new Date(r.uploaded_at).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/patient/records/${r.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => setUploadRecordOpen(true)}
              >
                <FileText className="size-4" />
                <span>Upload record</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <Link href="/patient/access">
                  <Lock className="size-4" />
                  <span>Manage access</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => setPatientOpen(true)}
              >
                <User className="size-4" />
                <span>Patient details</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                asChild
              >
                <Link href="/messages">
                  <MessageSquare className="size-4" />
                  <span>Messages</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
