"use client";

// Admin Login Page - Role-restricted authentication
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield } from "lucide-react";

import {
  loginSchema,
  type LoginFormValues,
  loginUser,
  getRoleFromUser,
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

export default function AdminLoginPage() {
  const router = useRouter();
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
      
      const role = getRoleFromUser(data.user);

      if (role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        return;
      }

      setSession(data);
      toast.success("Welcome to Admin Panel!");
      router.push("/dashboard");
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
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          MediLink Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access the admin dashboard
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
                    placeholder="admin@MediLink.com"
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
                    placeholder="Enter your password"
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
            {isSubmitting ? "Signing in..." : "Sign in to Admin"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-xs text-muted-foreground">
        This area is restricted to authorized administrators only.
      </p>
    </div>
  );
}
