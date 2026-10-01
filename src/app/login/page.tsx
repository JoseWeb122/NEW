"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_ACCOUNTS } from "@/lib/const";
import { login } from "@/lib/client";
import { ArrowRight, GraduationCap, Users, BookOpen, LayoutGrid, ShieldCheck } from "lucide-react";

const roleIcons: Record<string, typeof GraduationCap> = {
  student: GraduationCap,
  parent: Users,
  tutor: BookOpen,
  admin: LayoutGrid,
};

export default function LoginPage() {
  const router = useRouter();
  const [highlight, setHighlight] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setHighlight(p.get("role") ?? "");
  }, []);

  const go = (role: string, id: number, name: string, slug?: string, href?: string) => {
    setBusy(role);
    login({ role: role as "student", id, name, slug });
    setTimeout(() => router.push(href || `/portal/${role}`), 450);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-navy">
      <div className="bg-dots-dark absolute inset-0 opacity-40" />
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-royal/30 blur-3xl" />
      <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-amber/15 blur-3xl" />

      <div className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-royal font-display text-[15px] font-extrabold text-white">
            JS
            <span className="absolute -bottom-1 left-0 h-2 w-full bg-amber/90" />
          </span>
          <span className="font-display text-[15px] font-extrabold text-white">
            JS Tutoring <span className="text-amber">Academy</span>
          </span>
        </Link>
        <Link href="/" className="text-[13px] font-bold text-white/60 hover:text-white">← Back to website</Link>
      </div>

      <div className="wrap relative flex flex-1 items-center py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-1.5 text-[12px] font-bold text-amber">
              <ShieldCheck size={14} /> Secure demo environment
            </div>
            <h1 className="mt-5 font-display text-[42px] font-extrabold leading-[1.1] text-white">
              One platform.
              <br />
              Four perspectives.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
              This prototype includes ready-made accounts so you can explore every side of the
              academy — the student experience, the parent dashboard, the tutor workspace, and
              the administrative control panel.
            </p>
            <ul className="mt-8 space-y-3 text-[13.5px] font-semibold text-white/75">
              <li>• Student — Emma Rivera, Grade 4</li>
              <li>• Parent — Maria Rivera (two children)</li>
              <li>• Tutor — Sarah Johnson, Math & English</li>
              <li>• Admin — full academy control panel</li>
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((a, i) => {
              const Icon = roleIcons[a.role];
              const hl = highlight === a.role;
              return (
                <button
                  key={a.role}
                  onClick={() => go(a.role, a.id, a.name, a.slug)}
                  className={`anim-fade-up group cursor-pointer rounded-2xl border p-6 text-left transition-all duration-300 ${
                    hl
                      ? "border-amber bg-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)]"
                      : "border-white/15 bg-white/[0.06] backdrop-blur hover:border-white/40 hover:bg-white/10"
                  }`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl transition-colors ${
                      hl ? "bg-royal text-white" : "bg-white/10 text-amber group-hover:bg-white/20"
                    }`}
                  >
                    <Icon size={22} />
                  </span>
                  <div className="mt-4 font-display text-[18px] font-extrabold text-white">
                    {a.label}
                  </div>
                  <div className="mt-1 text-[13.5px] font-bold text-white/85">{a.name}</div>
                  <div className="mt-0.5 text-[12px] font-semibold text-white/50">{a.sub}</div>
                  <span
                    className={`mt-5 inline-flex items-center gap-1.5 text-[13px] font-extrabold ${
                      hl ? "text-royal" : "text-amber"
                    }`}
                  >
                    {busy === a.role ? "Signing in…" : "Enter portal"}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-8 text-center text-[12px] font-semibold text-white/40">
        Prototype environment — all accounts are pre-seeded with sample data.
      </div>
    </div>
  );
}
