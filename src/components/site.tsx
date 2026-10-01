"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "./ui";
import { SUBJECTS } from "@/lib/const";
import { useAuth, logout } from "@/lib/client";

export function Logo({ dark, small }: { dark?: boolean; small?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="JS Tutoring Academy home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-royal font-display text-[15px] font-extrabold text-white transition-transform duration-300 group-hover:scale-105">
        JS
        <span className="absolute -bottom-1 left-0 h-2 w-full bg-amber/90" />
      </span>
      {!small && (
        <span className="leading-none">
          <span className={cn("block font-display text-[15.5px] font-extrabold tracking-tight", dark ? "text-white" : "text-ink")}>
            JS Tutoring
          </span>
          <span className={cn("mt-0.5 block text-[10px] font-bold uppercase tracking-[0.32em]", dark ? "text-amber" : "text-royal")}>
            Academy
          </span>
        </span>
      )}
    </Link>
  );
}

const NAV = [
  { label: "Programs", href: "/#programs" },
  { label: "Subjects", href: "/subjects" },
  { label: "Find a Tutor", href: "/tutors" },
  { label: "Group Classes", href: "/classes" },
  { label: "Recorded Lessons", href: "/lessons" },
  { label: "How It Works", href: "/#how" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const portalHref = user?.role === "admin" ? "/portal/admin" : `/portal/${user?.role ?? "student"}`;

  return (
    <>
      {/* announcement */}
      <div className="relative z-40 bg-navy text-white">
        <div className="wrap flex items-center justify-center gap-2 py-2 text-center text-[12.5px] font-semibold">
          <Sparkles size={13} className="hidden shrink-0 text-amber sm:block" />
          <span className="text-white/85">
            Spring 2026 enrollment is open — book a free assessment session for your child.
          </span>
          <Link href="/book" className="hidden items-center gap-1 font-bold text-amber hover:underline sm:inline-flex">
            Reserve <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-line bg-cream/90 shadow-[0_6px_24px_-18px_rgb(19_28_46/0.4)] backdrop-blur-md"
            : "border-transparent bg-paper/70 backdrop-blur-sm"
        )}
      >
        <div className="wrap flex h-[68px] items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-6 xl:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={cn(
                  "navlink text-[13.5px] font-bold text-ink/80 transition-colors hover:text-ink",
                  pathname === n.href && "active text-royal"
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link href={portalHref} className="hidden text-[13.5px] font-bold text-sub hover:text-ink md:block">
                My Dashboard
              </Link>
            ) : (
              <Link href="/login" className="hidden text-[13.5px] font-bold text-sub transition-colors hover:text-ink md:block">
                Login
              </Link>
            )}
            <Link
              href="/book"
              className="hidden items-center gap-2 rounded-[10px] bg-amber px-4.5 py-2.5 text-sm font-bold text-white shadow-[0_6px_18px_-6px_rgb(232_150_46/0.55)] transition-all hover:bg-amber-deep sm:inline-flex"
            >
              Get Started <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-line bg-white p-2 text-ink xl:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-[80] xl:hidden">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col overflow-y-auto bg-cream shadow-2xl anim-fade-up" style={{ animationDuration: "0.3s" }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-sub hover:bg-ink/5 cursor-pointer" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col px-3 py-4">
              {NAV.map((n, i) => (
                <Link
                  key={n.label}
                  href={n.href}
                  className="anim-fade-up rounded-xl px-3 py-3 font-display text-[17px] font-bold text-ink hover:bg-royal-soft"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-line p-5">
              <Link
                href={user ? portalHref : "/login"}
                className="rounded-[10px] border border-line bg-white py-3 text-center text-sm font-bold text-ink"
              >
                {user ? "My Dashboard" : "Login"}
              </Link>
              <Link
                href="/book"
                className="rounded-[10px] bg-amber py-3 text-center text-sm font-bold text-white"
              >
                Get Started
              </Link>
              {user && (
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="cursor-pointer text-xs font-bold text-sub hover:text-clay"
                >
                  Sign out of {user.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="bg-dots-dark absolute inset-0 opacity-40" />
      <div className="wrap relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo dark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
              A K–12 tutoring academy helping students learn with confidence — live 1-on-1
              sessions, group classes, and recorded lessons across five core subjects.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Link
                  key={s.slug}
                  href={`/subjects`}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition-colors hover:border-amber hover:text-amber"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-amber">Platform</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" href="/tutors">Find a Tutor</Link></li>
              <li><Link className="hover:text-white" href="/classes">Group Classes</Link></li>
              <li><Link className="hover:text-white" href="/lessons">Recorded Lessons</Link></li>
              <li><Link className="hover:text-white" href="/book">Book a Session</Link></li>
              <li><Link className="hover:text-white" href="/login">Student & Parent Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-amber">Academy</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><Link className="hover:text-white" href="/about">About Us</Link></li>
              <li><Link className="hover:text-white" href="/#how">How It Works</Link></li>
              <li><Link className="hover:text-white" href="/subjects">Subjects</Link></li>
              <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
              <li><Link className="hover:text-white" href="/portal/admin">Administration</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-amber">Contact</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>hello@jstutoring.academy</li>
              <li>(555) 014-7788 · Mon–Sat</li>
              <li>Office hours: 8:00 AM – 6:00 PM</li>
              <li>Session hours: 3:00 PM – 8:00 PM daily</li>
            </ul>
            <div className="mt-5 rounded-xl border border-white/12 bg-white/5 p-4">
              <div className="text-[13px] font-bold">Session reminders</div>
              <p className="mt-1 text-xs leading-relaxed text-white/60">
                Parents get a reminder before every scheduled session — nothing missed.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/50 sm:flex-row">
          <span>© 2026 JS Tutoring Academy. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-white">Privacy</Link>
            <Link href="/about" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
