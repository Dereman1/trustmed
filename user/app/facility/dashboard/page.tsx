"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import { getMyProfile, updateMyProfile, type UserProfile } from "@/lib/profile";
import {
  getFacility,
  updateFacility,
  uploadVerificationDocs,
  listFacilityProviders,
  createFacilityProvider,
  uploadProviderVerificationDocs,
  getFacilityActivity,
  getPendingProvidersCount,
  type Facility as FacilityType,
  type Provider as ProviderType,
} from "@/lib/facility";
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
import Link from "next/link";
import {
  Building,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  AlertCircle,
  FileCheck,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MainLayout } from "@/components/MainLayout";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
});

const facilitySchema = z.object({
  facility_name: z.string().min(2, "Facility name is required").max(255),
  address: z.string().max(2000).optional().or(z.literal("")),
  contact_phone: z.string().max(50).optional().or(z.literal("")),
});

// Provider schema removed as it's now handled in /facility/providers


type ProfileFormValues = z.infer<typeof profileSchema>;
type FacilityFormValues = z.infer<typeof facilitySchema>;


export default function FacilityDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [facility, setFacility] = useState<FacilityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [providerDocsUploading, setProviderDocsUploading] = useState<
    string | null
  >(null);
  const [pendingProvidersCount, setPendingProvidersCount] = useState<number>(0);
  const [activity, setActivity] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providerDocInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const facilityForm = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema),
    defaultValues: { facility_name: "", address: "", contact_phone: "" },
  });



  const loadProviders = async () => {
    if (!user?.id) return;
    try {
      const list = await listFacilityProviders(user.id);
      setProviders(list);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profileRes, facilityRes] = await Promise.all([
        getMyProfile(),
        getFacility(user.id).catch(() => null),
      ]);
      setProfile(profileRes);
      setFacility(facilityRes ?? null);
      profileForm.reset({
        fullName: profileRes.fullName ?? "",
        phone: profileRes.phone ?? "",
      });
      if (facilityRes) {
        facilityForm.reset({
          facility_name: facilityRes.facility_name ?? "",
          address: facilityRes.address ?? "",
          contact_phone: facilityRes.contact_phone ?? "",
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
    if (facility?.status === "approved" && user?.id) {
      loadProviders();
      // Fetch pending providers count
      getPendingProvidersCount(user.id)
        .then(setPendingProvidersCount)
        .catch(() => setPendingProvidersCount(0));
      // Fetch recent activity
      getFacilityActivity(user.id)
        .then(setActivity)
        .catch(() => setActivity([]));
    }
  }, [facility?.status, user?.id]);

  useEffect(() => {
    if (searchParams.get("openFacilityProfile") === "true") {
      setFacilityOpen(true);
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

  const onFacilitySubmit = async (values: FacilityFormValues) => {
    if (!user?.id) return;
    try {
      const updated = await updateFacility(user.id, {
        facility_name: values.facility_name,
        address: values.address || undefined,
        contact_phone: values.contact_phone || undefined,
      });
      setFacility(updated);
      setFacilityOpen(false);
      toast.success("Facility profile updated");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };



  const onProviderVerificationDocs = async (providerId: string) => {
    if (!user?.id) return;
    const el = providerDocInputRefs.current[providerId];
    if (!el?.files?.length) {
      toast.error("Select at least one file");
      return;
    }
    const files = Array.from(el.files);
    if (files.length > 5) {
      toast.error("Max 5 files");
      return;
    }
    setProviderDocsUploading(providerId);
    try {
      await uploadProviderVerificationDocs(user.id, providerId, files);
      el.value = "";
      await loadProviders();
      toast.success("Verification documents uploaded");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setProviderDocsUploading(null);
    }
  };

  const onVerificationDocsSubmit = async () => {
    if (!user?.id || !fileInputRef.current?.files?.length) {
      toast.error("Please select at least one file");
      return;
    }
    const files = Array.from(fileInputRef.current.files);
    if (files.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    setUploadingDocs(true);
    try {
      const updated = await uploadVerificationDocs(user.id, files);
      setFacility(updated);
      fileInputRef.current.value = "";
      toast.success(
        "Verification documents submitted. Your facility is now under review.",
      );
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setUploadingDocs(false);
    }
  };

  const hasVerificationDocs = Boolean(
    facility?.verification_docs && facility.verification_docs.length > 0,
  );
  const isApproved = facility?.status === "approved";

  const isIncomplete = !hasVerificationDocs;
  const isPending = hasVerificationDocs && !isApproved;

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  // —— Pending approval: show dedicated page, no dashboard ——
  if (isPending) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
              <FileCheck className="size-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">Pending approval</CardTitle>
            <CardContent className="pt-4 space-y-2">
              <p className="text-slate-600">
                Your facility has submitted verification documents and is under
                review. You will get full access to the dashboard once an
                administrator approves your facility.
              </p>
              {Array.isArray(facility?.verification_docs) &&
                facility.verification_docs.length > 0 && (
                  <div className="space-y-1 pt-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Submitted documents:
                    </p>
                    <div className="flex flex-col gap-1">
                      {facility.verification_docs.map((url, i) => (
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
              <p className="text-sm text-slate-500">
                We will notify you when the review is complete.
              </p>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="mt-6 flex gap-2"
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // —— Incomplete: profile + facility details + verification docs ——
  if (isIncomplete) {
    return (
      <div className="container mx-auto p-6 space-y-8 max-w-2xl">
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Complete your facility setup</AlertTitle>
          <AlertDescription>
            Add your profile and facility details, then submit verification
            documents. Once submitted, your facility will be reviewed and you
            will see the dashboard after approval.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex gap-2"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Profile & facility details</CardTitle>
            <CardContent className="pt-0 text-sm text-slate-600">
              Update your profile and facility name, address, and contact phone.
            </CardContent>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Settings className="size-4" />
                    Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update profile</DialogTitle>
                    <DialogDescription>
                      Update your facility contact information
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
                            <FormLabel>Full name / Facility name</FormLabel>
                            <FormControl>
                              <Input placeholder="City Hospital" {...field} />
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
              <Dialog open={facilityOpen} onOpenChange={setFacilityOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <Building className="size-4" />
                    Facility details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Facility details</DialogTitle>
                    <DialogDescription>
                      Update your facility name, address, and contact
                      information
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...facilityForm}>
                    <form
                      onSubmit={facilityForm.handleSubmit(onFacilitySubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={facilityForm.control}
                        name="facility_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facility name</FormLabel>
                            <FormControl>
                              <Input placeholder="City Hospital" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={facilityForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Health St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={facilityForm.control}
                        name="contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact phone</FormLabel>
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
                          onClick={() => setFacilityOpen(false)}
                          disabled={facilityForm.formState.isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={facilityForm.formState.isSubmitting}
                        >
                          {facilityForm.formState.isSubmitting
                            ? "Saving..."
                            : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Verification documents</CardTitle>
            <CardContent className="pt-0 text-sm text-slate-600">
              Upload verification documents (e.g. license, registration). Max 5
              files. Required before your facility can be reviewed.
            </CardContent>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />
              <Button
                onClick={onVerificationDocsSubmit}
                disabled={uploadingDocs}
                className="flex gap-2"
              >
                {uploadingDocs ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileCheck className="size-4" />
                )}
                {uploadingDocs ? "Uploading…" : "Submit verification docs"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // —— Approved: full dashboard ——
  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Facility Dashboard
            </h1>
            <p className="text-slate-600">
              {facility?.facility_name || "Facility"} • Healthcare institution
            </p>
          </div>
        </div>

        {/* Profile Dialog - moved from header */}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update profile</DialogTitle>
              <DialogDescription>
                Update your facility contact information
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
                      <FormLabel>Full name / Facility name</FormLabel>
                      <FormControl>
                        <Input placeholder="City Hospital" {...field} />
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
                    {profileForm.formState.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Facility Details Dialog */}
        <Dialog open={facilityOpen} onOpenChange={setFacilityOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Facility details</DialogTitle>
              <DialogDescription>
                Update your facility information
              </DialogDescription>
            </DialogHeader>
            <Form {...facilityForm}>
              <form
                onSubmit={facilityForm.handleSubmit(onFacilitySubmit)}
                className="space-y-4"
              >
                <FormField
                  control={facilityForm.control}
                  name="facility_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility name</FormLabel>
                      <FormControl>
                        <Input placeholder="City Hospital" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={facilityForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Health St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={facilityForm.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact phone</FormLabel>
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
                    onClick={() => setFacilityOpen(false)}
                    disabled={facilityForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={facilityForm.formState.isSubmitting}
                  >
                    {facilityForm.formState.isSubmitting ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Assigned providers
              </CardTitle>
              <Users className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{providers.length}</div>
              <p className="text-xs text-slate-500">Manage staff below</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Status
              </CardTitle>
              <Settings className="size-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                Approved
              </div>
              <p className="text-xs text-slate-500">Facility approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Pending approvals
              </CardTitle>
              <ClipboardList className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {pendingProvidersCount}
              </div>
              <p className="text-xs text-slate-500">
                Providers awaiting approval
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                System status
              </CardTitle>
              <Settings className="size-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Online</div>
              <p className="text-xs text-slate-500">All modules running</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* {activity.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No recent activity yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activity.map((log, idx) => (
                    <li
                      key={log.id || idx}
                      className="text-sm text-slate-700 border-b last:border-b-0 pb-2"
                    >
                      <span className="font-medium">
                        {log.action_type.replace(/_/g, " ")}
                      </span>
                      {log.created_at && (
                        <span className="ml-2 text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      )}
                      {log.metadata && log.metadata.provider_id && (
                        <span className="ml-2 text-xs text-slate-500">
                          Provider: {log.metadata.provider_id}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )} */}

              {/* Providers management (moved from Management card) */}
              <div className="mt-1">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Providers
                </p>
                {providers.length === 0 ? (
                  <p className="text-sm text-slate-500">No providers yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {providers.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                      >
                        <span>
                          {p.specialization ?? "—"}{" "}
                          {p.license_number && `• ${p.license_number}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Show uploaded docs if present */}
                          {Array.isArray(p.verification_docs) &&
                          p.verification_docs.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {p.verification_docs.map(
                                (url: string, i: number) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary underline"
                                  >
                                    View doc {i + 1}
                                  </a>
                                ),
                              )}
                            </div>
                          ) : (
                            <>
                              <input
                                ref={(el) => {
                                  providerDocInputRefs.current[p.id] = el;
                                }}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                id={`provider-docs-${p.id}`}
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files?.length && user?.id) {
                                    uploadProviderVerificationDocs(
                                      user.id,
                                      p.id,
                                      Array.from(files),
                                    )
                                      .then(() => {
                                        loadProviders();
                                        toast.success("Documents uploaded");
                                        e.target.value = "";
                                      })
                                      .catch((err) =>
                                        toast.error(
                                          extractApiErrorMessage(err),
                                        ),
                                      )
                                      .finally(() =>
                                        setProviderDocsUploading(null),
                                      );
                                    setProviderDocsUploading(p.id);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={providerDocsUploading === p.id}
                                onClick={() =>
                                  document
                                    .getElementById(`provider-docs-${p.id}`)
                                    ?.click()
                                }
                              >
                                {providerDocsUploading === p.id
                                  ? "Uploading…"
                                  : "Upload verification docs"}
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Users className="size-5" />
                  Add provider
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register as provider</DialogTitle>
                </DialogHeader>
                <Form {...providerForm}>
                  <form
                    onSubmit={providerForm.handleSubmit(onAddProviderSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={providerForm.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. General Practice" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={providerForm.control}
                      name="license_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. MD-12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddProviderOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Add</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog> */}
              <Link href="/facility/providers">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Users className="size-5" />
                  Manage providers
                </Button>
              </Link>
              <div className="space-y-2">
                {/* <p className="text-sm font-medium text-slate-700">Providers</p>
                {providers.length === 0 ? (
                  <p className="text-sm text-slate-500">No providers yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {providers.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                      >
                        <span>
                          {p.specialization ?? "—"}{" "}
                          {p.license_number && `• ${p.license_number}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            ref={(el) => {
                              providerDocInputRefs.current[p.id] = el;
                            }}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id={`provider-docs-${p.id}`}
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files?.length && user?.id) {
                                uploadProviderVerificationDocs(
                                  user.id,
                                  p.id,
                                  Array.from(files),
                                )
                                  .then(() => {
                                    loadProviders();
                                    toast.success("Documents uploaded");
                                    e.target.value = "";
                                  })
                                  .catch((err) =>
                                    toast.error(extractApiErrorMessage(err)),
                                  )
                                  .finally(() =>
                                    setProviderDocsUploading(null),
                                  );
                                setProviderDocsUploading(p.id);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={providerDocsUploading === p.id}
                            onClick={() =>
                              document
                                .getElementById(`provider-docs-${p.id}`)
                                ?.click()
                            }
                          >
                            {providerDocsUploading === p.id
                              ? "Uploading…"
                              : "Upload verification docs"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )} */}
              </div>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={() => setFacilityOpen(true)}
              >
                <Building className="size-5" />
                Facility profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
