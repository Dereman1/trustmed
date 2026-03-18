"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetPasswordSchema, type ResetPasswordFormValues, resetPassword } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  useEffect(() => {
    // Supabase often sends reset tokens in the hash or query
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
    } else {
       // Check hash if not in query (Supabase default)
       const hash = window.location.hash.substring(1);
       const params = new URLSearchParams(hash);
       const hAccessToken = params.get("access_token");
       const hRefreshToken = params.get("refresh_token");
       if (hAccessToken && hRefreshToken) {
         setTokens({ accessToken: hAccessToken, refreshToken: hRefreshToken });
       }
    }
  }, [searchParams]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!tokens) {
      toast.error("Missing reset tokens. Please request a new reset link.");
      return;
    }

    try {
      form.clearErrors();
      await resetPassword(values, tokens.accessToken, tokens.refreshToken);
      toast.success("Password reset successfully. You can now login.");
      router.push("/login");
    } catch (error) {
      form.setError("root", {
        type: "server",
        message: extractApiErrorMessage(error),
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  if (!tokens) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Invalid or expired link
          </h1>
          <p className="text-sm text-slate-600">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Button onClick={() => router.push("/forgot-password")} className="w-full">
          Request new link
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Reset your password
        </h1>
        <p className="text-sm text-slate-600">
          Enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
