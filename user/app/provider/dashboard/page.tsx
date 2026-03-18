"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";

import {
  getMyProviderProfile,
  updateProviderProfile,
  getProviderStats,
  type ProviderProfile,
  type ProviderStats,
} from "@/lib/provider";
import { requestAccess, listGrantedToMe } from "@/lib/access";
import { listAllPatients, type PatientProfile } from "@/lib/patient";
import { getMyProfile, updateMyProfile, type UserProfile } from "@/lib/profile";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  ClipboardList,
  Calendar,
  Users,
  MessageSquare,
  LogOut,
  AlertCircle,
  Settings,
  Stethoscope,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NotificationBell } from "@/components/NotificationBell";
import { MainLayout } from "@/components/MainLayout";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(100),
  phone: z.string().max(20).optional().or(z.literal("")),
});

const providerSchema = z.object({
  specialization: z.string().min(1, "Specialization is required").max(255),
  license_number: z.string().min(1, "License number is required").max(100),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ProviderFormValues = z.infer<typeof providerSchema>;

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, accessToken, refreshToken, clearSession } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [providerProfile, setProviderProfile] =
    useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<
    (PatientProfile & { user_details?: UserProfile })[]
  >([]);
  const [selectedPatientForAccess, setSelectedPatientForAccess] =
    useState<string>("");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [stats, setStats] = useState<ProviderStats | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { specialization: "", license_number: "" },
  });

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profileRes, providerRes, statsRes] = await Promise.all([
        getMyProfile(),
        getMyProviderProfile().catch(() => null),
        getProviderStats().catch(() => null),
      ]);
      setProfile(profileRes);
      setProviderProfile(providerRes ?? null);
      setStats(statsRes ?? null);
      profileForm.reset({
        fullName: profileRes.fullName ?? "",
        phone: profileRes.phone ?? "",
      });
      if (providerRes) {
        providerForm.reset({
          specialization: providerRes.specialization ?? "",
          license_number: providerRes.license_number ?? "",
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

  const loadPatientsList = async () => {
    setLoadingPatients(true);
    try {
      const patients = await listAllPatients();
      // Ensure each patient has user_details: undefined for type compatibility
      const enriched = patients.map((patient) => {
        const { user_details, ...rest } = patient;
        return {
          ...rest,
          user_details: user_details || undefined,
        } as unknown as (PatientProfile & { user_details?: UserProfile });
      });
      setPatientsList(enriched);
      setSelectedPatientForAccess("");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
      setPatientsList([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const onRequestAccess = async (patientId: string) => {
    if (!patientId.trim()) {
      toast.error("Select a patient");
      return;
    }
    setRequestingAccess(true);
    try {
      await requestAccess(patientId.trim());
      // Keep dialog open if they want to request others, just reload list
      await loadPatientsList();
      await loadData();
      toast.success("Access requested");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setRequestingAccess(false);
    }
  };

  const onProviderSubmit = async (values: ProviderFormValues) => {
    try {
      const updated = await updateProviderProfile({
        specialization: values.specialization,
        license_number: values.license_number,
      });
      setProviderProfile(updated);
      setProviderOpen(false);
      toast.success("Provider profile updated");
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const isProfileComplete = Boolean(
    profile?.fullName &&
    providerProfile &&
    providerProfile.specialization &&
    providerProfile.license_number,
  );

  const hasProviderRow = Boolean(providerProfile);

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
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
          <div className="flex flex-wrap justify-between items-start  gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">
                Provider Dashboard
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Welcome back, Dr.{" "}
                {profile?.fullName || user?.fullName || "Provider"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="size-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </DialogTrigger>
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
                              <Input placeholder="Dr. Jane Smith" {...field} />
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total records
                </CardTitle>
                <ClipboardList className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats?.total_records ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Medical records accessed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total patients
                </CardTitle>
                <Users className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats?.total_patients ?? 0}
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs mt-1"
                  asChild
                >
                  <Link href="/provider/patients">View all</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total notes
                </CardTitle>
                <ClipboardList className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats?.total_notes ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created and updated
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total messages
                </CardTitle>
                <MessageSquare className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats?.total_messages ?? 0}
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs mt-1"
                  asChild
                >
                  <Link href="/provider/messages">View messages</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                <CardTitle>Request access</CardTitle>
                <Button size="sm" onClick={() => {
                  setRequestAccessOpen(true);
                  loadPatientsList();
                }}>
                  Request
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Request access to a patient&apos;s records. You need the
                  patient&apos;s ID.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/provider/patients">View my patients</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <Link href="/provider/patients">
                    <Users className="size-4" />
                    <span>View my patients</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <Link href="/messages">
                    <MessageSquare className="size-4" />
                    <span>Go to messages</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Dialog
            open={requestAccessOpen}
            onOpenChange={(open) => {
              if (open) {
                loadPatientsList();
              }
              setRequestAccessOpen(open);
            }}
          >
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Request access to patient</DialogTitle>
                <DialogDescription>
                  Select a patient to request access to their records
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-2">
                {loadingPatients ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Loading patients...
                    </p>
                  </div>
                ) : patientsList.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No patients available
                    </p>
                  </div>
                ) : (
                  patientsList.map((patient) => (
                    <div
                      key={patient.id}
                      className="w-full text-left px-4 py-3 rounded-lg border border-border flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {patient.user_details?.fullName ||
                            `Patient ${patient.user_id.slice(0, 8)}`}
                        </p>
                        {patient.user_details?.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {patient.user_details.email}
                          </p>
                        )}
                        {patient.date_of_birth && (
                          <p className="text-xs text-muted-foreground mt-1">
                            DOB:{" "}
                            {new Date(patient.date_of_birth).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        )}
                        {patient.gender && (
                          <p className="text-xs text-muted-foreground">
                            Gender: {patient.gender}
                          </p>
                        )}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">Request</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[425px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Request Access</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to request access to the medical records of {patient.user_details?.fullName || "this patient"}? They will be notified of this request.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRequestAccess(patient.user_id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}
