"use client";

import { useEffect, useState } from "react";

export interface Session {
  role: "student" | "parent" | "tutor" | "admin";
  id: number;
  name: string;
  slug?: string;
}

const KEY = "js_session";

export function api(path: string, opts?: { method?: string; body?: unknown }) {
  return fetch(path, {
    method: opts?.method ?? (opts?.body ? "POST" : "GET"),
    headers: opts?.body ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as { error?: string }).error || r.statusText);
    return data;
  });
}

export function useAuth() {
  const [state, setState] = useState<{ user: Session | null; ready: boolean }>({
    user: null,
    ready: false,
  });
  useEffect(() => {
    let user: Session | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) user = JSON.parse(raw) as Session;
    } catch {
      /* ignore */
    }
    setState({ user, ready: true });
  }, []);
  return state;
}

export function login(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function logout() {
  localStorage.removeItem(KEY);
}

/* formatting + date helpers (shared isomorphic module) */
export {
  money, money2, fmtGrade, dayShort, fmtDate, fmtDateLong, fmtTime,
  addDays, isoDay, hashStr, initials, slotsFor,
} from "./format";

export function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
