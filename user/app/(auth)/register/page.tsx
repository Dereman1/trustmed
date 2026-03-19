"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

import {
  registerSchema,
  type RegisterFormValues,
  registerUser,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  HeartPulse, 
  ShieldCheck, 
  Mail, 
  Lock,
  User,
  Calendar,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "patient";
  const initialRole = (roleParam === "facility" ? "facility" : "patient") as
    | "patient"
    | "facility";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      dateOfBirth: "",
      gender: "",
      address: "",
      contactPhone: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const selectedRole = form.watch("role");

  // Clear validation errors when field is edited
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && validationErrors[name]) {
        setValidationErrors((prev: Record<string, string>) => {
          const updatedErrors = { ...prev };
          delete updatedErrors[name];
          return updatedErrors;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, validationErrors]);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // Clear any existing errors
      form.clearErrors();
      setValidationErrors({});
      
      // Manually trigger validation before submit
      const isValid = await form.trigger();
      if (!isValid) {
        // Get all field errors
        const errors = form.formState.errors;
        const errorMap: Record<string, string> = {};
        
        Object.keys(errors).forEach(key => {
          const errorKey = key as keyof typeof errors;
          if (errors[errorKey]?.message) {
            errorMap[key] = errors[errorKey]?.message as string;
          }
        });
        
        setValidationErrors(errorMap);
        toast.error("Please fix the errors in the form");
        return;
      }
      
      await registerUser(values);
      toast.success(
        "Registration successful! Please check your email for a verification link.",
      );
      router.push(`/login?role=${values.role}`);
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);
      form.setError("root", {
        type: "server",
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  
  // Get form errors for display
  const errors = form.formState.errors;
  const hasErrors = Object.keys(errors).length > 0 || Object.keys(validationErrors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 to-orange-50/30 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-teal-600" />
            <span className="text-2xl font-bold text-teal-600">TrustMed</span>
          </Link>
        </div>

        {/* Register Card */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Create your account
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Join TrustMed to manage your medical records securely
              </p>
            </div>

            {/* Error Summary - Shows all validation errors at top */}
            {hasErrors && (
              <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="text-sm text-red-600 font-medium mb-1">
                    Please fix the following errors:
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {Object.keys(errors).map(key => {
                      if (key !== 'root') {
                        const errorKey = key as keyof typeof errors;
                        if (errors[errorKey]?.message) {
                          let fieldName = key;
                          if (key === 'fullName') fieldName = 'Full name';
                          if (key === 'email') fieldName = 'Email';
                          if (key === 'password') fieldName = 'Password';
                          if (key === 'confirmPassword') fieldName = 'Confirm password';
                          if (key === 'dateOfBirth') fieldName = 'Date of birth';
                          if (key === 'gender') fieldName = 'Gender';
                          if (key === 'address') fieldName = 'Address';
                          if (key === 'contactPhone') fieldName = 'Phone';
                          
                          return (
                            <li key={key}>
                              {fieldName}: {errors[errorKey]?.message as string}
                            </li>
                          );
                        }
                      }
                      return null;
                    })}
                    {Object.keys(validationErrors).map(key => (
                      <li key={key}>
                        {key}: {validationErrors[key]}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Role Selection */}
            <div className="mb-6">
              <Tabs
                value={selectedRole}
                className="w-full"
                onValueChange={(value) => {
                  form.setValue("role", value as typeof initialRole);
                  form.clearErrors();
                  setValidationErrors({});
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="patient">Patient</TabsTrigger>
                  <TabsTrigger value="facility">Facility</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Full Name / Facility Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        {selectedRole === "facility" ? "Facility Name" : "Full Name"}
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder={
                              selectedRole === "facility" ? "City Hospital" : "John Smith"
                            }
                            className={`pl-10 ${errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            {...field}
                            onBlur={() => {
                              field.onBlur();
                              form.trigger('fullName');
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Patient-specific fields */}
                {selectedRole === "patient" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">
                            Date of Birth <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input 
                                type="date" 
                                className={`pl-10 ${errors.dateOfBirth ? 'border-red-500' : ''}`} 
                                {...field} 
                                onBlur={() => form.trigger('dateOfBirth')}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">
                            Gender <span className="text-red-500 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className={`w-full h-10 rounded-md border ${errors.gender ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
                              value={field.value || ""}
                              onBlur={() => form.trigger('gender')}
                            >
                              <option value="" disabled>Select gender</option>
                              <option value="female">Female</option>
                              <option value="male">Male</option>
                            </select>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Facility-specific fields */}
                {selectedRole === "facility" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="123 Health St" 
                                className={`pl-10 ${errors.address ? 'border-red-500' : ''}`} 
                                {...field} 
                                onBlur={() => form.trigger('address')}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input 
                                placeholder="+251 912 345 678" 
                                className={`pl-10 ${errors.contactPhone ? 'border-red-500' : ''}`} 
                                {...field} 
                                onBlur={() => form.trigger('contactPhone')}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        Email <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                            {...field}
                            onBlur={() => form.trigger('email')}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        Password <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                            {...field}
                            onBlur={() => form.trigger('password')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">
                        Confirm Password <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            {...field}
                            onBlur={() => form.trigger('confirmPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs mt-1" />
                    </FormItem>
                  )}
                />

                {/* Server error message */}
                {errors.root?.message && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-600 text-sm">
                      {errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>

                {/* Terms */}
                <p className="text-xs text-center text-slate-500">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-teal-600 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-teal-600 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </Form>

            {/* Sign in link */}
            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                Already have an account?{" "}
                <Link
                  href={`/login?role=${selectedRole}`}
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Trust badge */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
            <ShieldCheck className="h-3 w-3 text-teal-500" />
            <span>Secure & encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}