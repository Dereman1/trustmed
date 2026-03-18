"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth-store";
import {
  listFacilityProviders,
  createFacilityProvider,
  uploadProviderVerificationDocs,
  type Provider as ProviderType,
} from "@/lib/facility";
import { extractApiErrorMessage } from "@/lib/api";
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
  ArrowLeft,
  Plus,
  FileCheck,
  CheckCircle2,
  Clock,
  Upload,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

const providerSchema = z.object({
  specialization: z.string().min(1, "Specialization is required").max(255),
  license_number: z.string().min(1, "License number is required").max(100),
  email: z.string().email("A valid email is required"),
  temporary_password: z.string().min(8, "Password must be at least 8 characters").optional(),
  verification_docs: z
    .instanceof(FileList)
    .refine(
      (files) => files.length > 0,
      "At least one verification document is required",
    )
    .refine((files) => files.length <= 5, "Maximum 5 files allowed"),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export default function FacilityProvidersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [providerDocsUploading, setProviderDocsUploading] = useState<
    string | null
  >(null);
  const providerDocInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      specialization: "",
      license_number: "",
      email: "",
      temporary_password: "",
      verification_docs: undefined,
    },
  });

  const loadProviders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await listFacilityProviders(user.id);
      setProviders(list);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [user?.id]);

  const onAddProviderSubmit = async (values: ProviderFormValues) => {
    if (!user?.id) return;
    try {
      const newProvider = await createFacilityProvider(user.id, {
        specialization: values.specialization,
        license_number: values.license_number,
        email: values.email,
        temporary_password: values.temporary_password || undefined,
      });
      // Always upload verification docs (required)
      const files = Array.from(values.verification_docs);
      try {
        await uploadProviderVerificationDocs(user.id, newProvider.id, files);
        toast.success("Provider registered with verification documents");
      } catch (docError) {
        toast.warning(
          "Provider registered but verification documents upload failed. Please upload them manually.",
        );
        console.error("Doc upload error:", docError);
      }

      setAddProviderOpen(false);
      providerForm.reset({
        specialization: "",
        license_number: "",
        email: "",
        temporary_password: "",
        verification_docs: undefined,
      });
      await loadProviders();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle2 className="size-4" />
            Approved
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
            <Clock className="size-4" />
            Pending
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {status}
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/facility/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Manage Providers
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Register and manage healthcare providers for your facility
              </p>
            </div>
            <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Register provider</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Register new provider</DialogTitle>
                  <DialogHeader>
                  <DialogDescription>
                    Add a new healthcare provider to your facility
                  </DialogDescription>
                </DialogHeader>
                </DialogHeader>
                <Form {...providerForm}>
                  <form
                    onSubmit={providerForm.handleSubmit(onAddProviderSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={providerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider Email</FormLabel>
                          <FormControl>
                            <Input placeholder="provider@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={providerForm.control}
                      name="temporary_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temporary Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Leave blank to auto-generate" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={providerForm.control}
                      name="specialization"

                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Cardiology" {...field} />
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
                            <Input placeholder="License number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={providerForm.control}
                      name="verification_docs"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Verification documents</FormLabel>
                          <FormControl>
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="size-5 text-muted-foreground mb-2" />
                                  <p className="text-xs text-muted-foreground text-center px-2">
                                    Click to upload (PDF, JPG, PNG, DOC). At
                                    least one file required.
                                  </p>
                                </div>
                                <input
                                  {...field}
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  onChange={(e) => onChange(e.target.files)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                            {value && value.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {value.length} file(s) selected
                              </div>
                            )}
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
                        disabled={providerForm.formState.isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={providerForm.formState.isSubmitting}
                      >
                        {providerForm.formState.isSubmitting
                          ? "Registering..."
                          : "Register"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Providers List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  No providers registered yet. Register your first provider to
                  get started.
                </p>
                <Button className="gap-2" onClick={() => setAddProviderOpen(true)}>
                  <Plus className="size-4" />
                  Register Provider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div>
                      <CardTitle className="text-lg">
                        {provider.specialization}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {provider.license_number
                          ? `License: ${provider.license_number}`
                          : "No license on file"}
                      </p>
                    </div>
                    {getStatusBadge(provider.status || "pending")}

                    <div></div>
                  </CardHeader>
                  <CardContent>
                    {provider.status === "pending" &&
                    !provider.verification_docs?.length ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Verification documents are required. Upload them to
                          proceed with approval.
                        </p>
                        <div className="flex flex-col gap-3">
                          <input
                            ref={(el) => {
                              if (el)
                                providerDocInputRefs.current[provider.id] = el;
                            }}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="text-xs w-full"
                          />
                          <Button
                            onClick={() =>
                              onProviderVerificationDocs(provider.id)
                            }
                            disabled={providerDocsUploading === provider.id}
                            size="sm"
                            className="w-full gap-2"
                          >
                            {providerDocsUploading === provider.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Upload className="size-4" />
                            )}
                            {providerDocsUploading === provider.id
                              ? "Uploading..."
                              : "Upload docs"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <FileCheck className="size-4" />
                         {Array.isArray(provider.verification_docs) &&
                          provider.verification_docs.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {provider.verification_docs.map(
                                (url: string, i: number) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary underline"
                                  >
                                    Verification doc
                                  </a>
                                ),
                              )}
                            </div>
                          ) : (
                            <p>Verification document submitted.</p>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
