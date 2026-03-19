"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  FileCheck,
  FileSearch,
  LogIn,
  LogOut,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";
import { logoutUser, getRoleFromUser, getDashboardPathForRole } from "@/lib/auth";
import { toast } from "sonner";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

type Step = {
  title: string;
  description: string;
};

type Benefit = {
  audience: string;
  title: string;
  items: string[];
  icon: React.ReactNode;
};

export default function Home() {
  const router = useRouter();
  const { user, accessToken, refreshToken, clearSession, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated || !user || !accessToken) return;
    const role = getRoleFromUser(user);
    const dashboardPath = getDashboardPathForRole(role);
    if (dashboardPath !== "/") {
      router.replace(dashboardPath);
    }
  }, [isHydrated, user, accessToken, router]);

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) {
        await logoutUser(accessToken, refreshToken);
      }
      clearSession();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      clearSession();
      router.push("/");
      router.refresh();
    }
  };

  const getDashboardUrl = () => getDashboardPathForRole(getRoleFromUser(user));

  if (!isHydrated) {
    return null;
  }

  const features: Feature[] = [
    {
      title: "Patient-controlled records",
      description: "You own your data. Store visits, labs, imaging, and prescriptions in one place and decide who can access it.",
      icon: <FileCheck className="h-6 w-6" strokeWidth={1.8} />,
    },
    {
      title: "Secure sharing",
      description: "Grant and revoke access to providers when you need to. Role-based permissions and audit trails keep everything transparent.",
      icon: <Lock className="h-6 w-6" strokeWidth={1.8} />,
    },
    {
      title: "Provider access",
      description: "Authorized clinicians see the full picture—reducing duplicate tests, delays, and paperwork at the point of care.",
      icon: <Stethoscope className="h-6 w-6" strokeWidth={1.8} />,
    },
    {
      title: "Audit logs",
      description: "Every access event is logged. Support compliance and accountability with clear, traceable activity records.",
      icon: <FileSearch className="h-6 w-6" strokeWidth={1.8} />,
    },
  ];

  const steps: Step[] = [
    { title: "Sign up", description: "Create your account as a patient or sign in as a provider or facility." },
    { title: "Add your records", description: "Upload and organize your medical history in a structured timeline." },
    { title: "Share with care team", description: "Grant access to specific providers; revoke anytime." },
    { title: "Better care", description: "Providers use your records to deliver faster, more informed care." },
  ];

  const benefits: Benefit[] = [
    {
      audience: "Patients",
      title: "Your data, your control",
      icon: <Users className="h-8 w-8" strokeWidth={1.6} />,
      items: [
        "One place for all your health records",
        "Decide who sees what and when",
        "Reduce repeat tests and forms",
        "Access from any device",
      ],
    },
    {
      audience: "Providers",
      title: "Full context, less friction",
      icon: <Stethoscope className="h-8 w-8" strokeWidth={1.6} />,
      items: [
        "View patient history with consent",
        "Fewer duplicate orders and delays",
        "Structured, easy-to-scan records",
        "Audit-ready access logs",
      ],
    },
    {
      audience: "Facilities",
      title: "Governance and compliance",
      icon: <Building2 className="h-8 w-8" strokeWidth={1.6} />,
      items: [
        "Centralized access policies",
        "Traceable sharing and access",
        "Support for local regulations",
        "Scalable for the Ethiopian pilot",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        userPresent={Boolean(user)}
        dashboardHref={user ? getDashboardUrl() : undefined}
        onLogout={handleLogout}
      />

      <main className="pt-[72px]">
        <HeroSection
          userPresent={Boolean(user)}
          onPatientSignup={() => router.push("/register?role=patient")}
          onProviderSignin={() => router.push("/login?role=provider")}
          onSignin={() => router.push("/login")}
          onGoDashboard={() => router.push(getDashboardUrl())}
        />

        <FeaturesSection features={features} />

        <HowItWorksSection steps={steps} />

        <BenefitsSection benefits={benefits} />

        <CtaSection
          onGetStarted={() => router.push("/register")}
          onSignIn={() => router.push("/login")}
        />
      </main>

      <SiteFooter />
    </div>
  );
}

// ─── Header: solid teal bar, coral accent CTA ─────────────────────────────

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15"
        aria-hidden
      >
        <ShieldCheck className="h-5 w-5 text-white" strokeWidth={1.8} />
      </div>
      <span className="text-lg font-bold tracking-tight text-white">TrustMed</span>
    </div>
  );
}

function SiteHeader({
  userPresent,
  dashboardHref,
  onLogout,
}: {
  userPresent: boolean;
  dashboardHref?: string;
  onLogout: () => void;
}) {
  return (
    <header
      id="security"
      className="fixed inset-x-0 top-0 z-50 bg-primary shadow-md"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded-md"
        >
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-white/90 md:flex" aria-label="Main">
          <a className="transition hover:text-white" href="#features">Features</a>
          <a className="transition hover:text-white" href="#workflow">How it works</a>
          <a className="transition hover:text-white" href="#benefits">Benefits</a>
        </nav>

        <div className="flex items-center gap-2">
          {userPresent ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref}>
                  <Button
                    size="sm"
                    className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 sm:gap-2"
                    variant="outline"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 sm:gap-2"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white sm:gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Provider Login</span>
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="gap-1.5 bg-[var(--trustmed-accent)] text-white hover:opacity-90 sm:gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Patient Sign Up</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Hero: split layout, left copy + right visual ─────────────────────────

function HeroSection({
  userPresent,
  onPatientSignup,
  onProviderSignin,
  onSignin,
  onGoDashboard,
}: {
  userPresent: boolean;
  onPatientSignup: () => void;
  onProviderSignin: () => void;
  onSignin: () => void;
  onGoDashboard: () => void;
}) {
  return (
    <section className="relative border-b-4 border-[var(--trustmed-accent)] bg-primary">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
            Ethiopian healthcare pilot
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[2.75rem]">
            Your health records.
            <br />
            <span className="text-[var(--trustmed-accent)]">You control who sees them.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/90">
            TrustMed is a patient-controlled digital health record platform. Store your medical history, share it securely with providers, and support better care—with full transparency and consent.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {userPresent ? (
              <>
                <Button
                  size="lg"
                  className="h-12 bg-[var(--trustmed-accent)] px-6 text-white hover:opacity-90"
                  onClick={onGoDashboard}
                >
                  Go to dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-transparent px-6 text-white hover:bg-white/10"
                  onClick={onSignin}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-12 bg-[var(--trustmed-accent)] px-6 text-white hover:opacity-90"
                  onClick={onPatientSignup}
                >
                  Patient Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-transparent px-6 text-white hover:bg-white/10"
                  onClick={onProviderSignin}
                >
                  Provider Login
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <Card className="w-full max-w-md overflow-hidden border-0 bg-white/95 shadow-xl">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <FileCheck className="h-4 w-4 text-primary" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold text-foreground">Your record summary</span>
              </div>
            </div>
            <div className="space-y-3 p-5">
                {["Visits & history", "Labs & imaging", "Prescriptions", "Shared with providers"].map((label, i) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">You control access</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ─── Features: bento-style grid, teal + coral accents ─────────────────────

function FeaturesSection({ features }: { features: Feature[] }) {
  return (
    <section id="features" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--trustmed-accent)]">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for trust and control
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Patient-controlled records, secure sharing, provider access, and audit logs—all in one platform for the Ethiopian healthcare pilot.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-l-4 border-l-[var(--trustmed-accent)] bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works: horizontal timeline ───────────────────────────────────

function HowItWorksSection({ steps }: { steps: Step[] }) {
  return (
    <section id="workflow" className="border-t border-border bg-muted/20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple workflow, clear steps
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            From sign-up to better care—see how TrustMed connects you and your providers.
          </p>
        </div>

        <div className="mt-14">
          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6" aria-label="Platform workflow">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-lg font-bold text-primary-foreground"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="mt-4">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─── Benefits: three columns (Patients, Providers, Facilities) ───────────

function BenefitsSection({ benefits }: { benefits: Benefit[] }) {
  return (
    <section id="benefits" className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--trustmed-accent)]">
            Benefits
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Value for everyone in the care journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Patients keep control. Providers get context. Facilities gain governance—all on one platform.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <Card
              key={benefit.audience}
              className="flex flex-col border-t-4 border-t-primary bg-card p-6 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {benefit.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                {benefit.audience}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">{benefit.title}</h3>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                {benefit.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--trustmed-accent)]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA: full-width teal band, coral button ─────────────────────────────

function CtaSection({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  return (
    <section className="bg-primary py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to take control of your health records?
        </h2>
        <p className="mt-4 text-lg text-white/90">
          Join TrustMed—the patient-controlled digital health record platform for the Ethiopian healthcare pilot.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 bg-[var(--trustmed-accent)] px-8 text-white hover:opacity-90"
            onClick={onGetStarted}
          >
            Create account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-white/40 bg-transparent px-8 text-white hover:bg-white/10"
            onClick={onSignIn}
          >
            Sign in
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer: dark teal, compact ──────────────────────────────────────────

function SiteFooter() {
  return (
    <footer className="bg-primary py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-white/80" aria-hidden />
            <span className="font-semibold text-white">TrustMed</span>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-white/80" aria-label="Footer">
            <Link href="#features" className="transition hover:text-white">Features</Link>
            <Link href="#workflow" className="transition hover:text-white">How it works</Link>
            <Link href="#benefits" className="transition hover:text-white">Benefits</Link>
            <Link href="#security" className="transition hover:text-white">Security</Link>
            <Link href="/login" className="transition hover:text-white">Login</Link>
            <Link href="/register" className="transition hover:text-white">Register</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-white/20 pt-6 text-center text-sm text-white/70 sm:text-left">
          <p>© {new Date().getFullYear()} TrustMed. Patient-controlled digital health records for the Ethiopian healthcare pilot.</p>
        </div>
      </div>
    </footer>
  );
}
