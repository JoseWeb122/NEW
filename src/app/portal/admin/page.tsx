"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalShell, PageHead, Loading, type TabDef } from "@/components/shell";
import {
  Card, Button, Badge, Avatar, Stat, Modal, Field, Input, Select, Textarea,
  T, Th, Td, Tr, BarChart, ProgressBar, EmptyState,
} from "@/components/ui";
import { SUBJECTS, GRADES, DAYS, gradeShort } from "@/lib/const";
import { api, useAuth, money, fmtDate, fmtTime, dayShort } from "@/lib/client";
import {
  Home, Users, GraduationCap, Layers, PlayCircle, CalendarDays, Wallet,
  BarChart3, Plus, Check, XCircle, Pencil, RotateCcw,
} from "lucide-react";

interface AdminData {
  counts: { students: number; tutors: number; classes: number; lessons: number; sessionsWeek: number; revenueTotal: number; avgProgress: number };
  students: { id: number; name: string; grade: number; guardian: string; hue: number }[];
  tutors: { id: number; name: string; slug: string; title: string; photo: string | null; subjects: string[]; experienceYears: number; rating: number; rate30: number; rate60: number; gradeMin: number; gradeMax: number }[];
  classes: { id: number; title: string; subject: string; grade: number; day: string; time: string; capacity: number; enrolled: number; fee: number; tutor: { name: string } | null }[];
  lessons: { id: number; title: string; subject: string; grade: number; durationMin: number; difficulty: string }[];
  bookings: { id: number; ref: string; subject: string; scheduledAt: string; price: number; status: string; student: { name: string; grade: number; hue: number } | null; tutor: { name: string } | null }[];
  payments: { id: number; invoiceNo: string; label: string; type: string; amount: number; date: string; status: string; studentId: number }[];
  weekly: { label: string; value: number }[];
  months: { label: string; value: number }[];
  bySubject: { subject: string; lessons: number; sessions: number; revenue: number }[];
  byLevel: { level: string; students: number }[];
}

export default function AdminPortal() {
  const { user } = useAuth();
  const [d, setD] = useState<AdminData | null>(null);
  const [modal, setModal] = useState<"" | "student" | "tutor" | "class" | "lesson">("");
  const [cancelB, setCancelB] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editTutor, setEditTutor] = useState<{ slug: string; name: string; title: string; r30: number; r60: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetState, setResetState] = useState({ busy: false, error: "", done: false });

  const load = useCallback(async () => {
    setD(await api("/api/admin"));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!d || !user)
    return <PortalShell expected="admin" roleLabel="Admin" tabs={[{ id: "x", label: "…", icon: Home, content: <Loading /> }]} />;
  const data = d;

  const saveStudent = async () => {
    if (!form.name) return;
    setSaving(true);
    await api("/api/students", { body: { name: form.name, grade: Number(form.grade ?? 1), guardian: form.guardian || "—", email: form.email || null } });
    setSaving(false); setModal(""); setForm({});
    load();
  };
  const saveClass = async () => {
    if (!form.title || !form.tutorId) return;
    setSaving(true);
    await api("/api/classes", {
      body: {
        title: form.title, subject: form.subject, grade: Number(form.grade),
        tutorId: Number(form.tutorId), day: form.day, time: form.time,
        capacity: Number(form.capacity ?? 8), fee: Number(form.fee ?? 35), description: form.description || "New weekly class.",
      },
    });
    setSaving(false); setModal(""); setForm({});
    load();
  };
  const saveLesson = async () => {
    if (!form.title) return;
    setSaving(true);
    await api("/api/lessons", {
      body: { title: form.title, subject: form.subject, grade: Number(form.grade), durationMin: Number(form.durationMin ?? 15), difficulty: form.difficulty ?? "Beginner", topic: form.topic || form.title, description: form.description || "New recorded lesson." },
    });
    setSaving(false); setModal(""); setForm({});
    load();
  };
  const saveTutor = async () => {
    if (!editTutor) return;
    setSaving(true);
    await api(`/api/tutors/${editTutor.slug}`, { body: { title: editTutor.title, rate30: editTutor.r30, rate60: editTutor.r60 } });
    setSaving(false); setModal("");
    load();
  };

  const closeReset = () => {
    setResetOpen(false);
    setResetState({ busy: false, error: "", done: false });
  };
  const resetDemo = async () => {
    setResetState({ busy: true, error: "", done: false });
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(resetToken ? { Authorization: `Bearer ${resetToken}` } : {}),
        },
        body: JSON.stringify({ action: "reset" }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Reset failed");
      setResetState({ busy: false, error: "", done: true });
      await load();
    } catch (e) {
      setResetState({ busy: false, error: e instanceof Error ? e.message : "Reset failed", done: false });
    }
  };

  const levelOf = (g: number) => (g <= 5 ? "Elementary" : g <= 8 ? "Middle" : "High");
  const maxLevel = Math.max(1, ...data.byLevel.map((l) => l.students));

  const tabs: TabDef[] = [
    { id: "home", label: "Overview", icon: Home, content: OverviewTab() },
    { id: "students", label: "Students", icon: Users, content: StudentsTab() },
    { id: "tutors", label: "Tutors", icon: GraduationCap, content: TutorsTab() },
    { id: "classes", label: "Classes", icon: Layers, content: ClassesTab() },
    { id: "lessons", label: "Lessons", icon: PlayCircle, content: LessonsTab() },
    { id: "bookings", label: "Bookings", icon: CalendarDays, content: BookingsTab() },
    { id: "payments", label: "Payments", icon: Wallet, content: PaymentsTab() },
    { id: "reports", label: "Reports", icon: BarChart3, content: ReportsTab() },
  ];

  return (
    <PortalShell expected="admin" roleLabel="Admin" tabs={tabs} />
  );

  function OverviewTab() {
    return (
      <div>
        <PageHead title="Academy Overview" sub="Live numbers across students, tutors, sessions, and revenue." action={
          <div className="flex items-center gap-2.5">
            <Badge tone="green" dot>System healthy</Badge>
            <Button size="sm" variant="outline" onClick={() => setResetOpen(true)}>
              <RotateCcw size={13} /> Reset demo data
            </Button>
          </div>
        } />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Students" value={data.counts.students} sub={`${data.byLevel[0].students} elementary · ${data.byLevel[1].students} middle · ${data.byLevel[2].students} high`} tone="royal" />
          <Stat icon={GraduationCap} label="Tutors" value={data.counts.tutors} sub="across 5 subjects" tone="green" />
          <Stat icon={CalendarDays} label="Sessions this week" value={data.counts.sessionsWeek} sub="next 7 days" tone="amber" />
          <Stat icon={Wallet} label="Total revenue" value={money(data.counts.revenueTotal)} sub={`${data.payments.length} transactions`} tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-5 font-display text-[16px] font-bold">Sessions — next 7 days</h2>
            <BarChart data={data.weekly} height={170} />
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 font-display text-[16px] font-bold">Revenue — last 5 months</h2>
            <BarChart data={data.months} height={170} color="#1E7A55" format={(v) => money(v)} />
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-[16px] font-bold">Latest bookings</h2>
            <div className="space-y-2.5">
              {data.bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3.5 rounded-xl border border-line p-3.5">
                  <Avatar name={b.student?.name ?? ""} size={36} hue={b.student?.hue} rounded="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold">{b.student?.name} · <span className="capitalize">{b.subject}</span></div>
                    <div className="text-[11.5px] font-semibold text-sub">{b.tutor?.name} · {fmtDate(b.scheduledAt)} {fmtTime(b.scheduledAt)}</div>
                  </div>
                  <Badge tone={b.status === "upcoming" ? "blue" : b.status === "cancelled" ? "red" : "green"}>{b.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-display text-[16px] font-bold">Enrollment by level</h2>
            <div className="space-y-4">
              {data.byLevel.map((l, i) => (
                <div key={l.level}>
                  <div className="mb-1.5 flex justify-between text-[12.5px] font-bold">
                    <span>{l.level}</span><span>{l.students} students</span>
                  </div>
                  <ProgressBar value={(l.students / maxLevel) * 100} color={["#B4552D", "#2B50C8", "#1E7A55"][i]} size="lg" />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-royal-soft p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-royal-deep">Average learning progress</div>
              <div className="mt-1 font-display text-[28px] font-extrabold text-royal-deep">{data.counts.avgProgress}%</div>
            </div>
          </Card>
        </div>
        <Modal open={resetOpen} onClose={closeReset} title="Reset demo data"
          footer={resetState.done ? <Button onClick={closeReset}>Done</Button> : <>
            <Button variant="outline" onClick={closeReset}>Cancel</Button>
            <Button variant="danger" onClick={resetDemo} disabled={resetState.busy}>{resetState.busy ? "Resetting…" : "Reset all data"}</Button>
          </>}>
          {resetState.done ? (
            <div className="flex items-center gap-3 rounded-xl bg-leaf-soft p-4 text-[13.5px] font-bold text-leaf">
              <Check size={18} /> Demo data restored — sessions, payments and progress are fresh again.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13.5px] font-semibold leading-relaxed text-sub">
                Replaces every student, booking, payment and note with the original demo dataset, with all dates re-anchored to today. Handy before a presentation.
              </p>
              <Field label="Setup token (only if SETUP_TOKEN is configured)">
                <Input type="password" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Leave blank in demo mode" />
              </Field>
              {resetState.error && (
                <div className="rounded-lg bg-clay-soft px-4 py-3 text-[13px] font-bold text-clay">{resetState.error}</div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }

  function StudentsTab() {
    return (
      <div>
        <PageHead title="Students" sub={`${data.counts.students} enrolled across K–12.`} action={<Button size="sm" variant="accent" onClick={() => { setModal("student"); setForm({}); }}><Plus size={14} /> Add student</Button>} />
        <T>
          <thead><tr><Th>Student</Th><Th>Grade</Th><Th>Level</Th><Th>Guardian</Th><Th className="text-right">Status</Th></tr></thead>
          <tbody>
            {data.students.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={34} hue={s.hue} rounded="rounded-full" />
                    <span className="font-bold">{s.name}</span>
                  </div>
                </Td>
                <Td>{s.grade === 0 ? "Kindergarten" : `Grade ${s.grade}`}</Td>
                <Td><Badge tone={s.grade <= 5 ? "amber" : s.grade <= 8 ? "blue" : "green"}>{levelOf(s.grade)}</Badge></Td>
                <Td className="text-sub">{s.guardian}</Td>
                <Td className="text-right"><Badge tone="green" dot>Active</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </T>

        <Modal open={modal === "student"} onClose={() => setModal("")} title="Add student"
          footer={<><Button variant="outline" onClick={() => setModal("")}>Cancel</Button><Button onClick={saveStudent} disabled={saving}>{saving ? "Saving…" : "Create student"}</Button></>}>
          <div className="space-y-4">
            <Field label="Full name"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Student name" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grade">
                <Select value={form.grade ?? "1"} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                  {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
              </Field>
              <Field label="Guardian"><Input value={form.guardian ?? ""} onChange={(e) => setForm({ ...form, guardian: e.target.value })} /></Field>
            </div>
            <Field label="Contact email"><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
        </Modal>
      </div>
    );
  }

  function TutorsTab() {
    return (
      <div>
        <PageHead title="Tutors" sub="Manage qualifications, subjects, and session rates." />
        <div className="grid gap-4 md:grid-cols-2">
          {data.tutors.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-3.5">
                <Avatar name={t.name} photo={t.photo} size={48} rounded="rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{t.name}</div>
                  <div className="truncate text-[12px] font-semibold text-sub">{t.title}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditTutor({ slug: t.slug, name: t.name, title: t.title, r30: t.rate30, r60: t.rate60 }); setModal("tutor"); }}>
                  <Pencil size={12} /> Edit
                </Button>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {t.subjects.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
                <Badge tone="outline">G{t.gradeMin === 0 ? "K" : t.gradeMin}–G{t.gradeMax}</Badge>
                <Badge tone="amber">{t.experienceYears} yrs</Badge>
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3 text-[12.5px] font-bold">
                <span className="text-sub">★ {t.rating.toFixed(1)} · {money(t.rate30)}/30m</span>
                <Badge tone="green" dot>Available</Badge>
              </div>
            </Card>
          ))}
        </div>

        <Modal open={modal === "tutor"} onClose={() => setModal("")} title={`Edit tutor — ${editTutor?.name}`}
          footer={<><Button variant="outline" onClick={() => setModal("")}>Cancel</Button><Button onClick={saveTutor} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></>}>
          {editTutor && (
            <div className="space-y-4">
              <Field label="Title"><Input value={editTutor.title} onChange={(e) => setEditTutor({ ...editTutor, title: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="30-min rate"><Input type="number" value={editTutor.r30} onChange={(e) => setEditTutor({ ...editTutor, r30: Number(e.target.value) })} /></Field>
                <Field label="60-min rate"><Input type="number" value={editTutor.r60} onChange={(e) => setEditTutor({ ...editTutor, r60: Number(e.target.value) })} /></Field>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  function ClassesTab() {
    return (
      <div>
        <PageHead title="Group Classes" sub={`${data.counts.classes} classes running this term.`} action={<Button size="sm" variant="accent" onClick={() => { setModal("class"); setForm({ subject: "math", grade: "5", day: "Tue", time: "5:00 PM", capacity: "8", fee: "35" }); }}><Plus size={14} /> Create class</Button>} />
        <T>
          <thead><tr><Th>Class</Th><Th>Subject</Th><Th>Grade</Th><Th>Tutor</Th><Th>Schedule</Th><Th>Enrollment</Th><Th className="text-right">Fee</Th></tr></thead>
          <tbody>
            {data.classes.map((c) => (
              <Tr key={c.id}>
                <Td className="font-bold">{c.title}</Td>
                <Td><Badge tone="blue" className="capitalize">{c.subject}</Badge></Td>
                <Td>{gradeShort(c.grade)}</Td>
                <Td className="text-sub">{c.tutor?.name}</Td>
                <Td className="whitespace-nowrap text-sub">{c.day} · {c.time}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={(c.enrolled / c.capacity) * 100} color={c.enrolled >= c.capacity ? "#C24A3D" : "#1E7A55"} size="sm" className="w-20" />
                    <span className="text-[12px] font-bold">{c.enrolled}/{c.capacity}</span>
                  </div>
                </Td>
                <Td className="text-right font-extrabold">{c.fee ? money(c.fee) : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </T>

        <Modal open={modal === "class"} onClose={() => setModal("")} title="Create group class" wide
          footer={<><Button variant="outline" onClick={() => setModal("")}>Cancel</Button><Button onClick={saveClass} disabled={saving}>{saving ? "Creating…" : "Create class"}</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class title" className="sm:col-span-2"><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Grade 6 Math — Ratios & Proportions" /></Field>
            <Field label="Subject">
              <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                {SUBJECTS.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Grade">
              <Select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Select>
            </Field>
            <Field label="Tutor">
              <Select value={form.tutorId ?? ""} onChange={(e) => setForm({ ...form, tutorId: e.target.value })}>
                <option value="">Select tutor</option>
                {data.tutors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Day">
                <Select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                  {DAYS.filter((x) => x !== "Sun").map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
              <Field label="Time">
                <Select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
                  {["4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"].map((x) => <option key={x}>{x}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Capacity"><Input type="number" value={form.capacity ?? "8"} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
              <Field label="Monthly fee ($)"><Input type="number" value={form.fee ?? "35"} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
            </div>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
        </Modal>
      </div>
    );
  }

  function LessonsTab() {
    return (
      <div>
        <PageHead title="Lesson Library" sub={`${data.counts.lessons} recorded lessons organized by subject and grade.`} action={<Button size="sm" variant="accent" onClick={() => { setModal("lesson"); setForm({ subject: "math", grade: "4", durationMin: "15", difficulty: "Beginner" }); }}><Plus size={14} /> Add lesson</Button>} />
        <T>
          <thead><tr><Th>Lesson</Th><Th>Subject</Th><Th>Grade</Th><Th>Difficulty</Th><Th>Length</Th><Th className="text-right">Added</Th></tr></thead>
          <tbody>
            {data.lessons.map((l) => (
              <Tr key={l.id}>
                <Td className="font-bold">{l.title}</Td>
                <Td><Badge tone="blue" className="capitalize">{l.subject}</Badge></Td>
                <Td>{gradeShort(l.grade)}</Td>
                <Td className="text-sub">{l.difficulty}</Td>
                <Td className="text-sub">{l.durationMin} min</Td>
                <Td className="text-right"><Badge tone="green" dot>Published</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </T>

        <Modal open={modal === "lesson"} onClose={() => setModal("")} title="Add recorded lesson"
          footer={<><Button variant="outline" onClick={() => setModal("")}>Cancel</Button><Button onClick={saveLesson} disabled={saving}>{saving ? "Saving…" : "Publish lesson"}</Button></>}>
          <div className="space-y-4">
            <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Understanding Fractions" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Subject">
                <Select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {SUBJECTS.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Grade">
                <Select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                  {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Length (min)"><Input type="number" value={form.durationMin ?? "15"} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} /></Field>
              <Field label="Difficulty">
                <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </Select>
              </Field>
            </div>
            <Field label="Description"><Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
        </Modal>
      </div>
    );
  }

  function BookingsTab() {
    return (
      <div>
        <PageHead title="Bookings" sub="Every appointment across the academy. Cancelled sessions are refunded automatically." />
        <T>
          <thead><tr><Th>Ref</Th><Th>Student</Th><Th>Tutor</Th><Th>Subject</Th><Th>When</Th><Th className="text-right">Price</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {data.bookings.slice(0, 25).map((b) => (
              <Tr key={b.id}>
                <Td><span className="font-mono text-[12px] font-bold">{b.ref}</span></Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={b.student?.name ?? ""} size={28} hue={b.student?.hue} rounded="rounded-full" />
                    <span className="font-bold text-[13px]">{b.student?.name}</span>
                  </div>
                </Td>
                <Td className="text-sub">{b.tutor?.name}</Td>
                <Td className="capitalize">{b.subject}</Td>
                <Td className="whitespace-nowrap text-sub">{fmtDate(b.scheduledAt)} · {fmtTime(b.scheduledAt)}</Td>
                <Td className="text-right font-extrabold">{money(b.price)}</Td>
                <Td><Badge tone={b.status === "upcoming" ? "blue" : b.status === "cancelled" ? "red" : "green"}>{b.status}</Badge></Td>
                <Td>{b.status === "upcoming" && <button onClick={() => setCancelB(b.id)} className="cursor-pointer text-clay hover:underline"><XCircle size={14} /></button>}</Td>
              </Tr>
            ))}
          </tbody>
        </T>
        <Modal open={cancelB != null} onClose={() => setCancelB(null)} title="Cancel this booking?"
          footer={<><Button variant="outline" onClick={() => setCancelB(null)}>Keep booking</Button>
            <Button variant="danger" onClick={async () => { await api("/api/bookings", { body: { action: "cancel", id: cancelB } }); setCancelB(null); load(); }}>Cancel booking</Button>
          </>}>
          <p className="text-[14px] font-semibold text-sub">The student's parent will be notified and the fee refunded to their account.</p>
        </Modal>
      </div>
    );
  }

  function PaymentsTab() {
    return (
      <div>
        <PageHead title="Payments" sub={`${data.payments.length} transactions · ${money(data.counts.revenueTotal)} total revenue.`} />
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Stat icon={Wallet} label="Total revenue" value={money(data.counts.revenueTotal)} tone="green" />
          <Stat icon={CalendarDays} label="Session fees" value={money(data.payments.filter((p) => p.type === "session").reduce((a, p) => a + p.amount, 0))} tone="royal" />
          <Stat icon={Layers} label="Class fees" value={money(data.payments.filter((p) => p.type === "class").reduce((a, p) => a + p.amount, 0))} tone="amber" />
        </div>
        <T>
          <thead><tr><Th>Invoice</Th><Th>Description</Th><Th>Type</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead>
          <tbody>
            {data.payments.map((p) => (
              <Tr key={p.id}>
                <Td><span className="font-mono text-[12px] font-bold">{p.invoiceNo}</span></Td>
                <Td><span className="line-clamp-1 max-w-[300px] text-[13px] font-semibold">{p.label}</span></Td>
                <Td><Badge tone="outline" className="capitalize">{p.type}</Badge></Td>
                <Td className="text-sub">{fmtDate(p.date)}</Td>
                <Td className="text-right font-extrabold">{money(p.amount)}</Td>
                <Td><Badge tone="green">paid</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </T>
      </div>
    );
  }

  function ReportsTab() {
    return (
      <div>
        <PageHead title="Reports" sub="Academy performance at a glance — sessions, enrollment, revenue, and learning." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-5 font-display text-[16px] font-bold">Sessions by subject</h2>
            <BarChart data={data.bySubject.map((s) => ({ label: s.subject.slice(0, 3).toUpperCase(), value: s.sessions, color: SUBJECTS.find((x) => x.slug === s.subject)?.color }))} height={170} />
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 font-display text-[16px] font-bold">Content & revenue by subject</h2>
            <div className="space-y-4">
              {data.bySubject.map((s) => (
                <div key={s.subject} className="flex items-center gap-3">
                  <span className="w-20 text-[12.5px] font-bold capitalize text-sub">{s.subject}</span>
                  <div className="flex-1"><ProgressBar value={(s.revenue / Math.max(1, data.counts.revenueTotal)) * 100} color={SUBJECTS.find((x) => x.slug === s.subject)?.color} /></div>
                  <span className="w-16 text-right text-[12px] font-extrabold">{money(s.revenue)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-[15px] font-bold">Enrollment by level</h2>
            {data.byLevel.map((l, i) => (
              <div key={l.level} className="mb-3.5">
                <div className="mb-1 flex justify-between text-[12.5px] font-bold"><span>{l.level}</span><span>{l.students}</span></div>
                <ProgressBar value={(l.students / maxLevel) * 100} color={["#B4552D", "#2B50C8", "#1E7A55"][i]} size="lg" />
              </div>
            ))}
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-display text-[15px] font-bold">Learning progress</h2>
            <div className="flex items-center gap-5">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2B50C8 ${data.counts.avgProgress * 3.6}deg, rgba(19,28,46,0.08) 0deg)` }}>
                <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white">
                  <span className="font-display text-[19px] font-extrabold">{data.counts.avgProgress}%</span>
                </div>
              </div>
              <p className="text-[12.5px] font-semibold leading-relaxed text-sub">Average lesson completion across all student profiles this term.</p>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-display text-[15px] font-bold">Library coverage</h2>
            <div className="space-y-3">
              {SUBJECTS.map((s) => {
                const n = data.lessons.filter((l) => l.subject === s.slug).length;
                return (
                  <div key={s.slug} className="flex items-center gap-3">
                    <span className="w-20 text-[12.5px] font-bold text-sub">{s.name}</span>
                    <ProgressBar value={(n / Math.max(1, data.counts.lessons)) * 100} color={s.color} size="sm" className="flex-1" />
                    <span className="w-6 text-right text-[12px] font-extrabold">{n}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }
}
