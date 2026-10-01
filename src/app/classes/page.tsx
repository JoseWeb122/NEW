"use client";

import { useEffect, useState } from "react";
import { Header, Footer } from "@/components/site";
import { SectionHead, Chip, Select, Modal, Field, Button, Badge, Avatar, ProgressBar, EmptyState } from "@/components/ui";
import { ClassCard, type ClassLite } from "@/components/cards";
import { SUBJECTS, LEVELS, GRADES, DAYS } from "@/lib/const";
import { api, useAuth, money, fmtGrade } from "@/lib/client";
import { Users, Clock, CalendarDays, Check, SearchX, LogIn } from "lucide-react";

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [day, setDay] = useState("");
  const [joinId, setJoinId] = useState<number | null>(null);
  const [students, setStudents] = useState<{ id: number; name: string; grade: number }[]>([]);
  const [studentId, setStudentId] = useState(0);
  const [phase, setPhase] = useState<"form" | "saving" | "done" | "error">("form");
  const [err, setErr] = useState("");

  // read ?join= param
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const j = p.get("join");
    if (j) setJoinId(Number(j));
    const s = p.get("subject");
    if (s) setSubject(s);
  }, []);

  const params = [
    subject && `subject=${subject}`,
    level && `level=${level}`,
    grade && `grade=${grade}`,
  ].filter(Boolean).join("&");

  const filtered = classes
    .filter((c) => (day ? c.day === day : true))
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

  useEffect(() => {
    api(`/api/classes${params ? `?${params}` : ""}`).then((r) => {
      setClasses(r);
      setLoaded(true);
    });
  }, [params]);

  useEffect(() => {
    if (joinId) {
      api("/api/students").then((r) => {
        setStudents(r);
        setStudentId(r[0]?.id ?? 0);
      });
      setPhase("form");
    }
  }, [joinId]);

  const active = classes.find((c) => c.id === joinId);

  const enroll = async () => {
    setPhase("saving");
    try {
      const r = await api("/api/classes", { body: { classId: joinId, studentId } });
      if (r.ok) {
        setPhase("done");
        setClasses((cs) => cs.map((c) => (c.id === joinId ? { ...c, enrolled: c.enrolled + 1 } : c)));
      } else {
        setErr(r.error ?? "Could not enroll");
        setPhase("error");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <section className="border-b border-line bg-cream">
        <div className="wrap py-14">
          <SectionHead
            eyebrow="Group Classes"
            title="Weekly classes for every level"
            sub="Small, grade-matched groups with a recurring schedule. Seats are limited — reserve yours before the term fills up."
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex flex-wrap gap-2">
              <Chip active={!subject} onClick={() => setSubject("")}>All subjects</Chip>
              {SUBJECTS.map((s) => (
                <Chip key={s.slug} active={subject === s.slug} onClick={() => setSubject(subject === s.slug ? "" : s.slug)}>
                  {s.name}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.filter((d) => d !== "Sun").map((d) => (
                <Chip key={d} active={day === d} onClick={() => setDay(day === d ? "" : d)} className="px-3 py-1.5 text-[12px]">
                  {d}
                </Chip>
              ))}
            </div>
            <div className="ml-auto flex gap-3">
              <Select value={level} onChange={(e) => setLevel(e.target.value)} className="w-auto">
                <option value="">All levels</option>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
              <Select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-auto">
                <option value="">Any grade</option>
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-12">
        <p className="mb-6 text-sm font-bold text-sub">
          {loaded ? `${filtered.length} class${filtered.length === 1 ? "" : "es"} this term` : "Loading classes…"}
        </p>
        {loaded && filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="No classes match those filters" sub="Try another subject or day of the week." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c, i) => (
              <ClassCard key={c.id} cls={c} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* enrollment modal */}
      <Modal
        open={!!joinId}
        onClose={() => setJoinId(null)}
        title={phase === "done" ? "Enrollment confirmed" : "Join this class"}
      >
        {active && phase !== "done" && (
          <div className="space-y-5">
            <div className="rounded-xl border border-line bg-cream p-4">
              <div className="flex items-center gap-2">
                <Badge tone="blue" className="capitalize">{active.subject}</Badge>
                <Badge tone="outline">{fmtGrade(active.grade)}</Badge>
              </div>
              <h4 className="mt-2.5 font-display text-[16px] font-bold">{active.title}</h4>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px] font-bold text-sub">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {active.day} · {active.time}</span>
                <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {active.durationMin} minutes</span>
                <span className="inline-flex items-center gap-1.5"><Users size={13} /> {active.enrolled}/{active.capacity} enrolled</span>
                <span>{active.fee > 0 ? `${money(active.fee)} / month` : "Included in plan"}</span>
              </div>
              {active.tutor && (
                <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
                  <Avatar name={active.tutor.name} photo={active.tutor.photo} size={32} rounded="rounded-full" />
                  <span className="text-[13px] font-bold">Taught by {active.tutor.name}</span>
                </div>
              )}
            </div>

            {user && (user.role === "parent" || user.role === "student" || user.role === "admin") ? (
              <>
                <Field label="Select student">
                  <Select value={studentId} onChange={(e) => setStudentId(Number(e.target.value))}>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {fmtGrade(s.grade)}</option>
                    ))}
                  </Select>
                </Field>
                {phase === "error" && (
                  <div className="rounded-lg bg-clay-soft px-4 py-3 text-[13px] font-bold text-clay">{err}</div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setJoinId(null)}>
                    Cancel
                  </Button>
                  <Button variant="accent" className="flex-1" disabled={phase === "saving"} onClick={enroll}>
                    {phase === "saving" ? "Enrolling…" : active.fee > 0 ? `Confirm & pay ${money(active.fee)}` : "Confirm enrollment"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-amber/40 bg-amber-soft p-5 text-center">
                <LogIn size={20} className="mx-auto text-amber-deep" />
                <p className="mt-2 text-[13.5px] font-bold text-ink">
                  Sign in as a parent or student to enroll.
                </p>
                <Button href="/login?role=parent" variant="dark" size="sm" className="mt-3">
                  Go to Login
                </Button>
              </div>
            )}
          </div>
        )}
        {phase === "done" && (
          <div className="py-4 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-soft text-leaf">
              <Check size={30} />
            </span>
            <h4 className="mt-4 font-display text-[18px] font-bold">You're in!</h4>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-sub">
              {students.find((s) => s.id === studentId)?.name ?? "Your student"} is enrolled in{" "}
              <strong>{active?.title}</strong>. The class appears in their sessions and in your
              parent dashboard.
            </p>
            <div className="mt-4">
              <ProgressBar value={active ? ((active.enrolled) / active.capacity) * 100 : 0} color="#1E7A55" size="sm" className="mx-auto max-w-[220px]" />
              <div className="mt-1.5 text-[12px] font-bold text-sub">
                {active?.enrolled}/{active?.capacity} seats filled
              </div>
            </div>
            <Button variant="primary" className="mt-5 w-full" onClick={() => setJoinId(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
