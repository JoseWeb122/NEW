// Pure, isomorphic formatting helpers — safe to import from both
// server components and client components.

export function money(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${Number(n).toFixed(0)}`;
}

export function money2(n: number) {
  return `$${n.toFixed(2)}`;
}

export function fmtGrade(g: number) {
  return g === 0 ? "K" : `Grade ${g}`;
}

export function dayShort(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { weekday: "short" });
}

export function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateLong(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function fmtTime(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* Deterministic availability slots for a tutor on a given day */
export function slotsFor(
  tutorId: number,
  days: string[],
  date: Date
): { time: string; disabled: boolean }[] {
  const jsDay = date.toLocaleDateString("en-US", { weekday: "short" });
  if (!days.includes(jsDay) || jsDay === "Sun") return [];
  const slots: { time: string; disabled: boolean }[] = [];
  for (let h = 15; h <= 19; h++) {
    for (const m of [0, 30]) {
      const t = `${((h + 11) % 12) + 1}:${m === 0 ? "00" : "30"} PM`;
      const idx = (h - 15) * 2 + (m === 30 ? 1 : 0);
      const dayIdx = (date.getDate() + date.getMonth() * 3) % 7;
      const disabled = (dayIdx * 3 + idx * 5 + tutorId * 11) % 5 === 0;
      slots.push({ time: t, disabled });
    }
  }
  return slots;
}
