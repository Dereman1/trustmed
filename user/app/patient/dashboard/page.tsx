"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
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
import {
  listMyPermissions,
  listMyPermissionsWithProvider,
  grantAccess,
  revokeAccess,
  type AccessPermissionWithProvider,
} from "@/lib/access";
import { getMessages } from "@/lib/messages";
import { extractApiErrorMessage } from "@/lib/api";
import { logoutUser } from "@/lib/auth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
  User,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Lock,
  Upload,
  Share2,
  Stethoscope,
  Activity,
  Calendar,
  Shield,
  UserCircle,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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

/** Compute age from date of birth string (YYYY-MM-DD). */
function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

export default function PatientDashboard() {
  const [accessGrantedCount, setAccessGrantedCount] = useState(0);
  const [accessPendingCount, setAccessPendingCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [permissionsWithProvider, setPermissionsWithProvider] = useState<
    AccessPermissionWithProvider[]
  >([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [uploadRecordOpen, setUploadRecordOpen] = useState(false);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [actioningPermissionId, setActioningPermissionId] = useState<string | null>(null);
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

  const loadPermissionsWithProvider = async () => {
    try {
      const list = await listMyPermissionsWithProvider();
      setPermissionsWithProvider(list);
      setAccessGrantedCount(list.filter((p) => p.status === "granted").length);
      setAccessPendingCount(list.filter((p) => p.status === "pending").length);
    } catch {
      setPermissionsWithProvider([]);
      setAccessGrantedCount(0);
      setAccessPendingCount(0);
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
    if (user?.id) loadPermissionsWithProvider();
  }, [user?.id]);

  useEffect(() => {
    const loadMessagesCount = async () => {
      try {
        const messages = await getMessages({ limit: 100 });
        setMessagesCount(messages.length);
      } catch {
        setMessagesCount(0);
      }
    };
    if (user?.id) loadMessagesCount();
  }, [user?.id]);

  useEffect(() => {
    if (searchParams.get("openPatientDetails") === "true") setPatientOpen(true);
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) await logoutUser(accessToken, refreshToken);
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

  const handleGrantAccess = async (permissionId: string) => {
    setActioningPermissionId(permissionId);
    try {
      await grantAccess(permissionId);
      await loadPermissionsWithProvider();
      toast.success("Access granted");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setActioningPermissionId(null);
    }
  };

  const handleRevokeAccess = async (permissionId: string) => {
    setActioningPermissionId(permissionId);
    try {
      await revokeAccess(permissionId);
      await loadPermissionsWithProvider();
      toast.success("Access revoked");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setActioningPermissionId(null);
    }
  };

  const isProfileComplete = Boolean(
    profile?.fullName &&
      patientProfile?.date_of_birth &&
      patientProfile?.gender
  );

  const grantedPermissions = useMemo(
    () => permissionsWithProvider.filter((p) => p.status === "granted"),
    [permissionsWithProvider]
  );
  const pendingPermissions = useMemo(
    () => permissionsWithProvider.filter((p) => p.status === "pending"),
    [permissionsWithProvider]
  );

  // Build activity feed from records (upload) and permissions (granted/pending created).
  const activityItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "upload" | "granted" | "request";
      label: string;
      date: string;
    }> = [];
    records.forEach((r) => {
      items.push({
        id: `record-${r.id}`,
        type: "upload",
        label: `Record uploaded: ${r.record_type}`,
        date: r.uploaded_at,
      });
    });
    permissionsWithProvider.forEach((p) => {
      const name = p.provider_details?.fullName ?? "Provider";
      if (p.status === "granted" && p.granted_at) {
        items.push({
          id: `grant-${p.id}`,
          type: "granted",
          label: `Access granted to ${name}`,
          date: p.granted_at,
        });
      } else if (p.status === "pending" && p.created_at) {
        items.push({
          id: `req-${p.id}`,
          type: "request",
          label: `Access requested by ${name}`,
          date: p.created_at,
        });
      }
    });
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 6);
  }, [records, permissionsWithProvider]);

  const displayName = profile?.fullName || user?.fullName || "Patient";
  const age = getAge(patientProfile?.date_of_birth ?? null);
  const recentRecords = records.slice(0, 6);

  if (loading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardSkeleton />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!isProfileComplete && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Profile incomplete</AlertTitle>
              <AlertDescription>
                Complete your profile and patient details (date of birth and gender) to access all features.
              </AlertDescription>
            </Alert>
          )}

          {/* 1. Header / Welcome */}
          <header className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Welcome back, {displayName}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your medical records and provider access from here.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setProfileOpen(true)}
                >
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Records"
                value={records.length}
                href="/patient/records"
                icon={<FileText className="h-5 w-5 text-primary" />}
              />
              <StatCard
                label="Active providers"
                value={accessGrantedCount}
                icon={<Stethoscope className="h-5 w-5 text-primary" />}
              />
              <StatCard
                label="Pending requests"
                value={accessPendingCount}
                href="/patient/access"
                icon={<Clock className="h-5 w-5 text-[var(--trustmed-accent)]" />}
              />
              <StatCard
                label="Messages"
                value={messagesCount}
                href="/patient/messages"
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
              />
            </div>
          </header>

          {/* 2. Quick Actions - floating icon tiles */}
          <div className="mb-8 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-md sm:p-5">
            <p className="mb-4 text-sm font-medium text-muted-foreground">Quick actions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button
                className="h-auto flex-col gap-2 rounded-2xl border border-white/50 bg-white/60 py-5 shadow-sm backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setUploadRecordOpen(true)}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">Upload record</span>
              </Button>
              <Button variant="ghost" className="h-auto flex-col gap-2 rounded-2xl py-5 transition hover:scale-[1.02] hover:bg-white/50" asChild>
                <Link href="/patient/access">
                  <Clock className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Pending requests</span>
                </Link>
              </Button>
              <Button variant="ghost" className="h-auto flex-col gap-2 rounded-2xl py-5 transition hover:scale-[1.02] hover:bg-white/50" asChild>
                <Link href="/patient/access">
                  <Share2 className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Share records</span>
                </Link>
              </Button>
              <Button variant="ghost" className="h-auto flex-col gap-2 rounded-2xl py-5 transition hover:scale-[1.02] hover:bg-white/50" asChild>
                <Link href="/patient/access">
                  <Stethoscope className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Find provider</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Bento grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: Recent records + Active/Pending access */}
            <div className="space-y-6 lg:col-span-2">
              {/* 3. Recent Medical Records */}
              <Card className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-md transition hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/30 bg-white/40 px-4 py-4 sm:px-6">
                  <CardTitle className="text-lg">Recent medical records</CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={uploadRecordOpen} onOpenChange={setUploadRecordOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          Upload
                        </Button>
                      </DialogTrigger>
                      <UploadRecordDialog
                        recordForm={recordForm}
                        recordFileRef={recordFileRef}
                        uploadingRecord={uploadingRecord}
                        onUploadRecordSubmit={onUploadRecordSubmit}
                        setUploadRecordOpen={setUploadRecordOpen}
                      />
                    </Dialog>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/patient/records">
                        View all <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  {recentRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No records yet.</p>
                      <Button
                        className="mt-3"
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadRecordOpen(true)}
                      >
                        Upload your first record
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {recentRecords.map((r) => (
                        <RecordRow key={r.id} record={r} />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* 4. Active Provider Access + Pending */}
              <div className="space-y-6">
                <Card className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-md">
                  <CardHeader className="border-b border-white/30 bg-white/40 px-4 py-4 sm:px-6">
                    <CardTitle className="text-lg">Provider access</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Who can view your records
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {grantedPermissions.length === 0 && pendingPermissions.length === 0 ? (
                      <div className="rounded-2xl py-8 text-center text-sm text-muted-foreground">
                        No active or pending access. Manage sharing from{" "}
                        <Link href="/patient/access" className="text-primary underline">
                          Access
                        </Link>
                        .
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingPermissions.map((p) => (
                          <ProviderAccessRow
                            key={p.id}
                            permission={p}
                            status="pending"
                            onAccept={() => handleGrantAccess(p.id)}
                            onDecline={() => handleRevokeAccess(p.id)}
                            actioningId={actioningPermissionId}
                          />
                        ))}
                        {grantedPermissions.map((p) => (
                          <ProviderAccessRow
                            key={p.id}
                            permission={p}
                            status="granted"
                            onRevoke={() => handleRevokeAccess(p.id)}
                            actioningId={actioningPermissionId}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column: Health summary + Activity */}
            <div className="space-y-6">
              {/* 5. Health Summary */}
              <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-md">
                <CardHeader className="border-b border-white/30 bg-white/40 px-4 py-4 sm:px-6">
                  <CardTitle className="text-lg">Health summary</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-4 sm:px-6">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Age</dt>
                      <dd className="font-medium">{age != null ? age : "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Gender</dt>
                      <dd className="font-medium">{patientProfile?.gender ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Blood type</dt>
                      <dd className="font-medium">—</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Last updated</dt>
                      <dd className="font-medium">
                        {patientProfile?.updated_at
                          ? new Date(patientProfile.updated_at).toLocaleDateString()
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setPatientOpen(true)}
                  >
                    Edit patient details
                  </Button>
                </CardContent>
              </Card>

              {/* 6. Recent Activity */}
              <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-md">
                <CardHeader className="border-b border-white/30 bg-white/40 px-4 py-4 sm:px-6">
                  <CardTitle className="text-lg">Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-4 sm:px-6">
                  {activityItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                  ) : (
                    <ul className="space-y-4">
                      {activityItems.map((item) => (
                        <ActivityItem key={item.id} item={item} />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      {/* Dialogs: Profile, Patient, Upload (handled above) */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                      <Input type="tel" placeholder="+1 234 567 890" {...field} />
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
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? "Saving..." : "Save"}
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
            <DialogDescription>Update your date of birth and gender</DialogDescription>
          </DialogHeader>
          <Form {...patientForm}>
            <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-4">
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
                <Button type="submit" disabled={patientForm.formState.isSubmitting}>
                  {patientForm.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-24 w-64 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
          <div className="h-48 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
          <div className="h-56 animate-pulse rounded-2xl border border-white/50 bg-white/70" />
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href?: string;
  icon: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-md transition hover:scale-[1.02] hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-3xl font-bold tabular-nums text-foreground sm:text-4xl">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
  if (href) {
    return <Link href={href} className="outline-none">{content}</Link>;
  }
  return content;
}

// ─── Record row ──────────────────────────────────────────────────────────

function RecordRow({ record }: { record: MedicalRecord }) {
  const date = record.uploaded_at
    ? new Date(record.uploaded_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  return (
    <li>
      <Link
        href={`/patient/records/${record.id}`}
        className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-4 transition hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{record.record_type}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <span className="text-xs font-medium text-primary">View</span>
      </Link>
    </li>
  );
}

// ─── Provider access row (granted or pending) ──────────────────────────────

function ProviderAccessRow({
  permission,
  status,
  onAccept,
  onDecline,
  onRevoke,
  actioningId,
}: {
  permission: AccessPermissionWithProvider;
  status: "granted" | "pending";
  onAccept?: () => void;
  onDecline?: () => void;
  onRevoke?: () => void;
  actioningId: string | null;
}) {
  const name = permission.provider_details?.fullName ?? "Provider";
  const exp = permission.expires_at
    ? new Date(permission.expires_at).toLocaleDateString()
    : null;
  const busy = actioningId === permission.id;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/50 bg-white/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {status === "granted" && exp && (
            <p className="text-xs text-muted-foreground">Expires {exp}</p>
          )}
          {status === "pending" && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              Pending
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {status === "pending" && onAccept && onDecline && (
          <>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground"
              onClick={() => onAccept()}
              disabled={busy}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline()}
              disabled={busy}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Decline
            </Button>
          </>
        )}
        {status === "granted" && onRevoke && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onRevoke()}
            disabled={busy}
          >
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Activity feed item ──────────────────────────────────────────────────

function ActivityItem({
  item,
}: {
  item: { type: "upload" | "granted" | "request"; label: string; date: string };
}) {
  const icon =
    item.type === "upload" ? (
      <FileText className="h-4 w-4 text-primary" />
    ) : item.type === "granted" ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-[var(--trustmed-accent)]" />
    );
  const dateStr = new Date(item.date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="text-xs text-muted-foreground">{dateStr}</p>
      </div>
    </li>
  );
}

// ─── Upload record dialog (extracted for clarity) ──────────────────────────

function UploadRecordDialog({
  recordForm,
  recordFileRef,
  uploadingRecord,
  onUploadRecordSubmit,
  setUploadRecordOpen,
}: {
  recordForm: ReturnType<typeof useForm<RecordFormValues>>;
  recordFileRef: React.RefObject<HTMLInputElement | null>;
  uploadingRecord: boolean;
  onUploadRecordSubmit: (v: RecordFormValues) => Promise<void>;
  setUploadRecordOpen: (open: boolean) => void;
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload record</DialogTitle>
        <DialogDescription>Upload a new medical record to your profile</DialogDescription>
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
                  <Input placeholder="e.g. Lab results" {...field} />
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
                  <Input placeholder="Brief description" {...field} />
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
  );
}
