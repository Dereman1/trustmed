import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-[oklch(0.98_0.02_259)] to-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg ring-1 ring-border backdrop-blur">
        {children}
      </div>
    </div>
  );
}
