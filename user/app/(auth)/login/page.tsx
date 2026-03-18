"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "patient";

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

      toast.success("Welcome back!");

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
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
          
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Welcome back to MediLink
        </h1>
        <p className="text-sm text-slate-600">
          Sign in to securely access your digital medical records.
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <Link
          href="/register"
          className="font-medium text-sky-700 hover:underline"
        >
          Create an account
        </Link>
        <Link
          href="/forgot-password"
          className="font-medium text-sky-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

