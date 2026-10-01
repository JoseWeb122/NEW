"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Home, ArrowLeft, type LucideIcon } from "lucide-react";
import { cn, Avatar } from "./ui";
import { useAuth, logout } from "@/lib/client";

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
}

export function LoginGate({ expected }: { expected: "student" | "parent" | "tutor" | "admin" }) {
  const { user } = useAuth();
  if (user && user.role === expected) return null;
  const labels: Record<string, string> = {
    student: "Student",
    parent: "Parent",
    tutor: "Tutor",
    admin: "Administrator",
  };
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-5 py-16">
      <div className="card w-full max-w-md p-8 text-center anim-fade-up">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-royal-soft text-royal font-display text-lg font-extrabold">
          JS
        </span>
        <h1 className="mt-5 font-display text-xl font-bold">
          {labels[expected]} Portal
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-sub">
          Please sign in to continue. This prototype includes a ready-made{" "}
          {labels[expected].toLowerCase()} demo account.
        </p>
        <Link
          href={`/login?role=${expected}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-royal py-3 text-sm font-bold text-white hover:bg-royal-deep"
        >
          Sign in to the {labels[expected]} portal
        </Link>
        <Link href="/" className="mt-4 inline-block text-xs font-bold text-sub hover:text-ink">
          ← Back to the website
        </Link>
      </div>
    </div>
  );
}

export function PortalShell({
  expected,
  roleLabel,
  accent = "#2B50C8",
  tabs,
  topExtra,
}: {
  expected: "student" | "parent" | "tutor" | "admin";
  roleLabel: string;
  accent?: string;
  tabs: TabDef[];
  topExtra?: ReactNode;
}) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  if (!ready)
    return (
      <div className="min-h-screen bg-paper">
        <Loading label="Opening your portal…" />
      </div>
    );
  if (!user || user.role !== expected) return <LoginGate expected={expected} />;

  const activeId = tabs.some((t) => t.id === active) ? active : tabs[0]?.id;
  const current = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="min-h-screen bg-paper">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-cream md:flex">
        <div className="border-b border-line px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-royal font-display text-[15px] font-extrabold text-white">
              JS
              <span className="absolute -bottom-1 left-0 h-2 w-full bg-amber/90" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[14.5px] font-extrabold tracking-tight">JS Tutoring</span>
              <span className="mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.3em] text-royal">
                {roleLabel} Portal
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left text-[13.5px] font-bold transition-all",
                activeId === t.id
                  ? "bg-navy text-white shadow-[0_8px_20px_-10px_rgb(14_27_51/0.6)]"
                  : "text-sub hover:bg-ink/5 hover:text-ink"
              )}
            >
              <t.icon size={17} className={activeId === t.id ? "text-amber" : ""} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgb(19_28_46/0.05)]">
            <Avatar name={user.name} size={38} hue={215} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold">{user.name}</div>
              <div className="text-[11px] font-semibold text-sub capitalize">{user.role}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2 text-xs font-bold text-sub hover:text-ink"
            >
              <ArrowLeft size={13} /> Site
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2 text-xs font-bold text-sub hover:text-clay"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-royal font-display text-[13px] font-extrabold text-white">JS</span>
            <span className="font-display text-[14px] font-extrabold">{roleLabel} Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold text-sub xs:block">{user.name}</span>
            <Avatar name={user.name} size={32} hue={215} />
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="cursor-pointer rounded-lg border border-line p-2 text-sub"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
        {topExtra}
      </div>

      {/* content */}
      <main className="md:pl-[248px]">
        <div className="wrap max-w-[1120px] pb-28 pt-7 md:pb-16 md:pt-9">{current?.content}</div>
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur md:hidden">
        <div className={cn("flex", tabs.length > 5 ? "gap-0 overflow-x-auto px-1" : "justify-around px-1")}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "flex min-w-[64px] cursor-pointer flex-col items-center gap-1 px-2 pb-3 pt-2.5 text-[10px] font-bold transition-colors",
                activeId === t.id ? "text-royal" : "text-sub"
              )}
            >
              <span
                className="grid h-8 w-12 place-items-center rounded-full transition-colors"
                style={{
                  background: activeId === t.id ? accent + "1c" : "transparent",
                  color: activeId === t.id ? accent : undefined,
                }}
              >
                <t.icon size={19} />
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* Page heading used inside portal tabs */
export function PageHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[26px] font-extrabold tracking-tight sm:text-[30px]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-xl text-sm text-sub">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* simple loading skeleton */
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-sm font-bold text-sub">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-royal border-t-transparent" />
        {label}
      </div>
    </div>
  );
}
