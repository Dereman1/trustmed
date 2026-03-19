"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  Lock,
  LogIn,
  FileBadge,
  LogOut,
  LayoutDashboard,
  Shield,
  Sparkles,
  Stethoscope,
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
      title: "Unified patient record",
      description:
        "Keep visits, labs, imaging, prescriptions, and notes organized in one secure timeline.",
      icon: <FileText className="h-5 w-5" strokeWidth={1.6} />,
    },
    {
      title: "Privacy-first security",
      description:
        "Role-based access, secure sessions, and audit-friendly workflows designed for trust.",
      icon: <Lock className="h-5 w-5" strokeWidth={1.6} />,
    },
    {
      title: "Share with the right team",
      description:
        "Grant and revoke access when you need to—patients stay in control of their data.",
      icon: <Users className="h-5 w-5" strokeWidth={1.6} />,
    },
    {
      title: "Provider-ready workflows",
      description:
        "Fast review, better context, fewer repeats—supporting better decisions at the point of care.",
      icon: <Stethoscope className="h-5 w-5" strokeWidth={1.6} />,
    },
    {
      title: "Integrity and compliance posture",
      description:
        "Designed to support strong governance with consistent metadata and access boundaries.",
      icon: <Shield className="h-5 w-5" strokeWidth={1.6} />,
    },
    {
      title: "Accessible everywhere",
      description:
        "A responsive experience that works across mobile, tablet, and desktop—without friction.",
      icon: <Sparkles className="h-5 w-5" strokeWidth={1.6} />,
    },
  ];

  const steps: Step[] = [
    {
      title: "Create your account",
      description: "Sign up as a patient (free) or sign in as a healthcare provider.",
    },
    {
      title: "Store & organize records",
      description: "Upload and keep history structured so it’s easy to find when it matters.",
    },
    {
      title: "Control access",
      description: "Share with specific providers and revoke access at any time.",
    },
    {
      title: "Deliver better care",
      description: "Providers view complete context to reduce delays and duplicate tests.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        userPresent={Boolean(user)}
        dashboardHref={user ? getDashboardUrl() : undefined}
        onLogout={handleLogout}
      />

      <main className="pt-16">
        <HeroSection
          userPresent={Boolean(user)}
          onPatientSignup={() => router.push("/register?role=patient")}
          onProviderSignin={() => router.push("/login?role=provider")}
          onSignin={() => router.push("/login")}
          onGoDashboard={() => router.push(getDashboardUrl())}
        />

        <FeaturesSection features={features} />

        <WorkflowSection steps={steps} />

        <CtaSection
          onGetStarted={() => router.push("/register")}
          onSignIn={() => router.push("/login")}
        />
      </main>

      <SiteFooter />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
        <FileBadge className="h-5 w-5 text-primary" strokeWidth={1.6} />
      </div>
      <div className="leading-none">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-semibold tracking-tight">Record</span>
          <span className="text-lg font-semibold tracking-tight text-primary italic">
            X
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Patient record system</div>
      </div>
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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <BrandMark />
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a className="hover:text-foreground transition-colors" href="#features">
            Features
          </a>
          <a className="hover:text-foreground transition-colors" href="#workflow">
            Workflow
          </a>
          <a className="hover:text-foreground transition-colors" href="#security">
            Security
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {userPresent ? (
            <>
              {dashboardHref ? (
                <Link href={dashboardHref}>
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : null}
              <Button variant="destructive" className="gap-2" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-160px] h-[420px] w-[420px] rounded-full bg-[oklch(0.9_0.05_160)] blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:pb-20 lg:pt-18">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            <BadgeCheck className="h-4 w-4 text-primary" />
            Built for secure patient records and smooth provider access
          </div>

          <div className="space-y-4">
            <h1 className="text-pretty text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Modern patient records,{" "}
              <span className="text-primary">securely shared</span> when it matters.
            </h1>
            <p className="max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              RecordX helps patients store and manage their medical history, and helps
              providers access the right context—fast, responsibly, and with clear control.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {userPresent ? (
              <>
                <Button size="lg" className="h-12 px-6" onClick={onGoDashboard}>
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6" onClick={onSignin}>
                  Sign in
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="h-12 px-6" onClick={onPatientSignup}>
                  Patient sign up (free)
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6" onClick={onProviderSignin}>
                  Healthcare provider sign in
                </Button>
              </>
            )}
          </div>

          <div id="security" className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            <TrustPill icon={<Shield className="h-4 w-4" strokeWidth={1.6} />} title="Security first" text="Access boundaries & responsible sharing" />
            <TrustPill icon={<ClipboardCheck className="h-4 w-4" strokeWidth={1.6} />} title="Clear workflow" text="Organized history for fast review" />
            <TrustPill icon={<BadgeCheck className="h-4 w-4" strokeWidth={1.6} />} title="Built for trust" text="Consistent records and audit-friendly patterns" />
          </div>
        </div>

        <div className="relative">
          <Card className="overflow-hidden border-border/60 bg-card/60 shadow-sm">
            <div className="border-b border-border/60 bg-background/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10">
                    <Shield className="h-4 w-4 text-primary" strokeWidth={1.6} />
                  </div>
                  Patient summary
                </div>
                <div className="text-xs text-muted-foreground">Last updated: Today</div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MetricCard label="Records indexed" value="1,248" />
                <MetricCard label="Access grants" value="12" />
                <MetricCard label="Recent visits" value="8" />
                <MetricCard label="Labs & imaging" value="36" />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.9_0.05_160)] ring-1 ring-[oklch(0.9_0.05_160)]/60">
                    <Stethoscope className="h-5 w-5 text-[oklch(0.28_0.05_160)]" strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">Share with your provider</p>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Controlled
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Grant access for a visit, then revoke automatically after the care episode.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.6} />
                  Ready for mobile, tablet, and desktop
                </div>
                <span className="text-xs text-muted-foreground">Responsive UI</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TrustPill({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function FeaturesSection({ features }: { features: Feature[] }) {
  return (
    <section id="features" className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to manage records responsibly
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            A clean experience for patients and providers, built for clarity, security, and
            accessibility.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 bg-card/60 p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({ steps }: { steps: Step[] }) {
  return (
    <section id="workflow" className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">Benefits & workflow</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              A workflow that respects time and privacy
            </h2>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Patients stay in control. Providers get the context they need, without endless
              back-and-forth. The result is a simpler, more trustworthy experience.
            </p>
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold">{step.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function CtaSection({
  onGetStarted,
  onSignIn,
}: {
  onGetStarted: () => void;
  onSignIn: () => void;
}) {
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-background/70 p-8 shadow-sm sm:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/10">
                <BadgeCheck className="h-4 w-4" />
                Get started in minutes
              </div>
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Bring your records together with RecordX
              </h2>
              <p className="text-pretty text-sm text-muted-foreground sm:text-base">
                Create an account to start organizing your health history and sharing it with the
                right care team—securely.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 px-6" onClick={onGetStarted}>
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6" onClick={onSignIn}>
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <BrandMark />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              A trustworthy patient record platform designed for clarity, privacy, and access
              control.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                { label: "Features", href: "#features" },
                { label: "Workflow", href: "#workflow" },
                { label: "Security", href: "#security" },
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                { label: "Login", href: "/login" },
                { label: "Register", href: "/register" },
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: "Privacy policy", href: "#privacy" },
                { label: "Terms", href: "#terms" },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RecordX. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" strokeWidth={1.6} />
            <span>Designed for secure healthcare experiences.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}