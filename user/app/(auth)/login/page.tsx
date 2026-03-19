"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  loginSchema,
  type LoginFormValues,
  loginUser,
  getRoleFromUser,
  getDashboardPathForRole,
} from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
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
import { Card } from "@/components/ui/card";
import { 
  HeartPulse, 
  ShieldCheck, 
  Mail, 
  Lock as LockIcon,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      form.clearErrors();
      const { data } = await loginUser(values);
      setSession(data);

      const role = getRoleFromUser(data.user);

      if (data.user.mustChangePassword) {
        toast.info("Please change your password to continue");
        if (role === "provider") {
          router.push("/provider/change-password");
        } else {
          router.push("/change-password");
        }
        return;
      }

      const dashboardPath = getDashboardPathForRole(role);

      toast.success("Welcome back to TrustMed!");

      router.push(dashboardPath);
      router.refresh();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      toast.error(message);
      form.setError("root", {
        type: "server",
        message: message,
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 to-orange-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <HeartPulse className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                TrustMed
              </span>
              <span className="text-xs text-slate-500">Patient-Controlled Health Records</span>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <div className="p-8">
            {/* Header */}
            <div className="space-y-2 mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h1>
              <p className="text-slate-600 text-sm">
                Sign in to securely access your TrustMed account
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Email address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="pl-10 border-slate-200 focus:border-teal-300 focus:ring focus:ring-teal-200/20 transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pl-10 pr-10 border-slate-200 focus:border-teal-300 focus:ring focus:ring-teal-200/20 transition-all"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root?.message ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">
                      {form.formState.errors.root.message}
                    </p>
                  </div>
                ) : null}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-200/50 transition-all duration-200 h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in to TrustMed"
                  )}
                </Button>
              </form>
            </Form>

            {/* Footer Links */}
            <div className="mt-8 flex items-center justify-between text-sm">
              <Link
                href="/register"
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Create an account
              </Link>
              <Link
                href="/forgot-password"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </Card>

        {/* Trust Badge */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
            <span>Secured with end-to-end encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}