"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { forgotPasswordSchema, type ForgotPasswordFormValues, forgotPassword } from "@/lib/auth";
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

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      redirectTo : "https://MediLinkx.vercel.app/reset-password"
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      form.clearErrors();
      await forgotPassword(values.email);
      setIsSuccess(true);
    } catch (error) {
      form.setError("root", {
        type: "server",
        message: extractApiErrorMessage(error),
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Check your email
          </h1>
          <p className="text-sm text-slate-600">
            If an account exists for {form.getValues("email")}, we've sent instructions to reset your password.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full">Return to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Forgot password?
        </h1>
        <p className="text-sm text-slate-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
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
            {isSubmitting ? "Sending link..." : "Send reset link"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-xs text-slate-600">
        <Link
          href="/login"
          className="font-medium text-sky-700 hover:underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
