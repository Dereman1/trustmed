"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
  changePassword,
} from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { MainLayout } from "@/components/MainLayout";
import { Lock, ShieldCheck, Key } from "lucide-react";

export default function ProviderChangePasswordPage() {
  const router = useRouter();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword(values);
      toast.success("Password updated successfully!");
      router.push("/provider/dashboard");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-4 py-2 bg-gradient-to-br from-slate-50 to-blue-50/50">
        <div className="w-full max-w-lg">
          {/* Decorative Elements */}
         

          <Card className="border-none shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] overflow-hidden bg-white/80 backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            
            <CardHeader className="text-center pt-2 pb-1 px-10">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                Security Update
              </CardTitle>
              <CardDescription className="text-base text-slate-500 max-w-sm mx-auto">
                You are required to update your temporary password to ensure your account remains secure.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-10 pb-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-slate-700">
                          <Key className="size-3.5" /> Current Password
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your current password"
                            className="h-12 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-xs font-medium" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <ShieldCheck className="size-3.5" /> New Password
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="New password"
                              className="h-12 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <ShieldCheck className="size-3.5" /> Confirm New
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new"
                              className="h-12 border-slate-200 focus:border-primary focus:ring-primary/10 transition-all"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-xs font-medium" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-center text-xs text-slate-400 mt-6">
                    Make sure your new password is at least 8 characters long and includes numbers and special characters.
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
