"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  BookOpen,
  Sigma,
  Pencil,
  FlaskConical,
  PenLine,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import { reducedMotion, initials } from "@/lib/client";

/* ---------------- cn ---------------- */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Buttons ---------------- */
type BtnVariant = "primary" | "accent" | "outline" | "ghost" | "dark" | "danger" | "light";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-bold rounded-[10px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-royal text-white hover:bg-royal-deep shadow-[0_6px_18px_-6px_rgb(43_80_200/0.5)]",
  accent:
    "bg-amber text-white hover:bg-amber-deep shadow-[0_6px_18px_-6px_rgb(232_150_46/0.55)]",
  outline: "border border-line bg-white text-ink hover:border-royal hover:text-royal",
  ghost: "text-ink hover:bg-ink/5",
  dark: "bg-navy text-white hover:bg-navy-2",
  danger: "bg-clay text-white hover:brightness-95",
  light: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
};

const btnSizes: Record<BtnSize, string> = {
  sm: "text-[13px] px-3.5 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-[15px] px-7 py-3.5",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...rest
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  href?: string;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(btnBase, btnVariants[variant], btnSizes[size], className);
  if (href) {
    const ext = href.startsWith("http");
    return (
      <Link href={href} className={cls} target={ext ? "_blank" : undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  children,
  className,
  lift,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  lift?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={cn("card", lift && "lift", className)} onClick={onClick}>
      {children}
    </div>
  );
}

/* ---------------- Badge ---------------- */
const badgeTones: Record<string, string> = {
  blue: "bg-royal-soft text-royal-deep",
  amber: "bg-amber-soft text-amber-deep",
  green: "bg-leaf-soft text-leaf",
  red: "bg-clay-soft text-clay",
  gray: "bg-ink/6 text-sub",
  navy: "bg-navy text-white",
  outline: "border border-line text-sub bg-white",
};

export function Badge({
  tone = "gray",
  children,
  className,
  dot,
}: {
  tone?: string;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold tracking-wide",
        badgeTones[tone] || badgeTones.gray,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------------- Forms ---------------- */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-sub">{hint}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("input", props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("input min-h-[96px]", props.className)} />;
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          on ? "bg-royal" : "bg-ink/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
            on ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
      {label && <span className="text-sm font-semibold text-ink group-hover:text-royal">{label}</span>}
    </button>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-navy/55 backdrop-blur-[3px] anim-fade-up"
        style={{ animationDuration: "0.25s" }}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative card w-full rounded-b-none sm:rounded-b-[14px] max-h-[92vh] flex flex-col anim-fade-up",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
        style={{ animationDuration: "0.3s" }}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h3 className="font-display text-[17px] font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-sub hover:bg-ink/5 hover:text-ink cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Progress ---------------- */
export function ProgressBar({
  value,
  color,
  className,
  size = "md",
}: {
  value: number;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-ink/8", h, className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || "#2B50C8" }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 92,
  stroke = 9,
  color = "#2B50C8",
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (reducedMotion()) {
      setV(value);
      return;
    }
    const t = setTimeout(() => setV(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(19,28,46,0.09)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, v)) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,0.65,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold leading-none">
          {Math.round(v)}
          {label === undefined ? "%" : label}
        </span>
        {sub && <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({
  name,
  photo,
  size = 44,
  hue = 215,
  className,
  rounded = "rounded-xl",
}: {
  name: string;
  photo?: string | null;
  size?: number;
  hue?: number;
  className?: string;
  rounded?: string;
}) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 object-cover", rounded, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-display font-bold text-white", rounded, className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------------- Stars ---------------- */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-amber text-amber" : "text-ink/20"}
        />
      ))}
    </span>
  );
}

/* ---------------- Stat ---------------- */
export function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "royal",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "royal" | "amber" | "green" | "navy";
}) {
  const tones: Record<string, string> = {
    royal: "bg-royal-soft text-royal-deep",
    amber: "bg-amber-soft text-amber-deep",
    green: "bg-leaf-soft text-leaf",
    navy: "bg-navy/8 text-navy",
  };
  return (
    <Card className="flex items-start gap-4 p-5">
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-sub">{label}</div>
        <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        {sub && <div className="mt-0.5 text-xs font-medium text-sub">{sub}</div>}
      </div>
    </Card>
  );
}

/* ---------------- Section heading ---------------- */
export function SectionHead({
  eyebrow,
  title,
  sub,
  action,
  center,
  dark,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  action?: ReactNode;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", center && "sm:flex-col sm:items-center text-center")}>
      <div className={cn("max-w-2xl", center && "mx-auto")}>
        {eyebrow && (
          <div className={cn("mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em]", center && "justify-center", dark ? "text-amber" : "text-royal")}>
            <span className={cn("h-px w-7", dark ? "bg-amber" : "bg-royal")} />
            {eyebrow}
          </div>
        )}
        <h2 className={cn("font-display text-3xl font-bold leading-[1.12] tracking-tight sm:text-[38px]", dark ? "text-white" : "text-ink")}>
          {title}
        </h2>
        {sub && <p className={cn("mt-4 text-[15px] leading-relaxed", dark ? "text-white/70" : "text-sub")}>{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------------- Chip ---------------- */
export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-all duration-200",
        active
          ? "border-navy bg-navy text-white shadow-sm"
          : "border-line bg-white text-sub hover:border-navy/40 hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Subject icon ---------------- */
const subjectIcons: Record<string, { Icon: LucideIcon; soft: string }> = {
  reading: { Icon: BookOpen, soft: "#F7EAE3" },
  math: { Icon: Sigma, soft: "#E9EEFC" },
  spelling: { Icon: Pencil, soft: "#F3E9F1" },
  science: { Icon: FlaskConical, soft: "#E1F2EA" },
  english: { Icon: PenLine, soft: "#ECEAF5" },
};

export function SubjectIcon({
  slug,
  size = 22,
  className,
  withBg,
}: {
  slug: string;
  size?: number;
  className?: string;
  withBg?: boolean;
}) {
  const s = subjectIcons[slug] || subjectIcons.math;
  if (!withBg) return <s.Icon size={size} className={className} />;
  return (
    <span className="grid place-items-center rounded-xl" style={{ background: s.soft, color: "#131c2e", width: size + 20, height: size + 20 }}>
      <s.Icon size={size} />
    </span>
  );
}

/* ---------------- Reveal (scroll) ---------------- */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      el.classList.add("on");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ ["--rd" as string]: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- Counter ---------------- */
export function Counter({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      setV(to);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref}>
      {v}
      {suffix}
    </span>
  );
}

/* ---------------- Bar chart (CSS) ---------------- */
export function BarChart({
  data,
  height = 150,
  color = "#2B50C8",
  format,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="text-[11px] font-bold text-sub opacity-0 transition-opacity group-hover:opacity-100">
            {format ? format(d.value) : d.value}
          </div>
          <div
            className="anim-bar w-full max-w-[46px] rounded-t-[6px] transition-colors"
            style={{
              height: `${(d.value / max) * 78}%`,
              minHeight: d.value > 0 ? 6 : 2,
              background: d.color || color,
              animationDelay: `${i * 70}ms`,
              opacity: d.value > 0 ? 1 : 0.25,
            }}
          />
          <div className="text-[11px] font-semibold text-sub">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Table ---------------- */
export function T({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-line bg-cream px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-sub", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("border-b border-line/70 px-4 py-3.5 align-middle", className)}>{children}</td>;
}
export function Tr({ children, hover }: { children: ReactNode; hover?: boolean }) {
  return <tr className={cn(hover !== false && "transition-colors hover:bg-royal-soft/40")}>{children}</tr>;
}

/* ---------------- Empty state ---------------- */
export function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-royal-soft text-royal">
        <Icon size={22} />
      </span>
      <div className="font-display text-[15px] font-bold">{title}</div>
      {sub && <p className="max-w-sm text-sm text-sub">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
