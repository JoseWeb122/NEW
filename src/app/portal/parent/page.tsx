"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell, PageHead, Loading, type TabDef } from "@/components/shell";
import {
  Card,
  Button,
  Badge,
  Avatar,
  Stat,
  ProgressBar,
  SubjectIcon,
  Modal,
  Field,
  Input,
  Select,
  EmptyState,
  Toggle,
  T, Th, Td, Tr,
} from "@/components/ui";
import type { LessonLite } from "@/components/cards";
import { SUBJECTS, GRADES } from "@/lib/const";
import { api, useAuth, money, fmtDate, fmtDateLong, fmtTime, dayShort } from "@/lib/client";
import {
  Home, Users, CalendarDays, TrendingUp, User,
  Play, Check, Plus, Video, ArrowRight, FileText, Receipt,
  MessageSquare, RotateCcw, XCircle, Shield, CreditCard, Download, GraduationCap,
} from "lucide-react";

type Kid = { id: number; name: string; grade: number; guardian: string; hue: number };
type Booking = {
  id: number; ref: string; subject: string; kind: string; scheduledAt: string;
  durationMin: number; price: number; status: string;
  tutor: { name: string; photo: string | null } | null;
};
type Payment = { id: number; invoiceNo: string; label: string; type: string; amount: number; date: string; status: string };
type Assignment = { id: number; title: string; subject: string; dueAt: string; status: string; score: number | null; feedback: string | null };
type Note = { id: number; summary: string; focus: string; practice: string; createdAt: string; tutor: { name: string } | null };

export default function ParentPortal() {
  const { user } = useAuth();
  const [kids, setKids] = useState<Kid[]>([]);
  const [kidId, setKidId] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lessons, setLessons] = useState<(LessonLite & { addedAt: string; popularity: number })[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", grade: 2 });
  const [adding, setAdding] = useState(false);
  const [resched, setResched] = useState<Booking | null>(null);
  const [cancelB, setCancelB] = useState<Booking | null>(null);
  const [rDay, setRDay] = useState("");
  const [rTime, setRTime] = useState("");
  const [prefs, setPrefs] = useState({ rem: true, weekly: true, receipts: true });

  const loadKids = useCallback(async () => {
    const k = (await api("/api/students?parentId=1")) as Kid[];
    setKids(k);
    setKidId((cur) => (k.some((x) => x.id === cur) ? cur : k[0]?.id ?? 0));
  }, []);

  const loadChild = useCallback(async (id: number) => {
    if (!id) return;
    const [b, l, a, p, n] = await Promise.all([
      api(`/api/bookings?studentId=${id}`),
      api(`/api/lessons?studentId=${id}`),
      api(`/api/assignments?studentId=${id}`),
      api(`/api/payments?studentId=${id}`),
      api(`/api/notes?studentId=${id}`),
    ]);
    setBookings(b); setLessons(l); setAssigns(a); setPays(p); setNotes(n);
  }, []);

  useEffect(() => {
    loadKids().then(() => setLoaded(true));
  }, [loadKids]);
  useEffect(() => {
    loadChild(kidId);
  }, [kidId, loadChild]);

  const kid = kids.find((k) => k.id === kidId) ?? null;
  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === "upcoming" && new Date(b.scheduledAt) > now);
  const past = bookings.filter((b) => new Date(b.scheduledAt) <= now || b.status === "cancelled").reverse();
  const next = upcoming[0];
  const bySubject = SUBJECTS.map((s) => {
    const ls = lessons.filter((l) => l.subject === s.slug);
    const as = assigns.filter((a) => a.subject === s.slug);
    const vals = [...ls.map((l) => l.percent ?? 0), ...as.map((a) => (a.status === "done" ? 100 : 0))];
    const avg = vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : 0;
    return { ...s, avg };
  });
  const overall = Math.round(bySubject.reduce((a, s) => a + s.avg, 0) / bySubject.length);
  const attended = past.filter((b) => b.status !== "cancelled").length;
  const attendance = past.length ? Math.round((attended / past.length) * 100) : 100;
  const totalPaid = pays.reduce((a, p) => a + p.amount, 0);

  if (!loaded || !user)
    return <PortalShell expected="parent" roleLabel="Parent" tabs={[{ id: "x", label: "…", icon: Home, content: <Loading /> }]} />;
  const me = user;

  const refresh = () => { loadKids(); loadChild(kidId); };

  const addKid = async () => {
    if (!addForm.name) return;
    setAdding(true);
    await api("/api/students", {
      body: { name: addForm.name, grade: addForm.grade, guardian: me.name, email: "maria.rivera@example.com", guardianId: 1 },
    });
    setAdding(false);
    setAddOpen(false);
    setAddForm({ name: "", grade: 2 });
    refresh();
  };

  const doReschedule = async () => {
    if (!resched || !rDay || !rTime) return;
    await api("/api/bookings", { body: { action: "reschedule", id: resched.id, scheduledAt: new Date(`${rDay}T${t24(rTime)}:00`).toISOString() } });
    setResched(null);
    loadChild(kidId);
  };

  const doCancel = async () => {
    if (!cancelB) return;
    await api("/api/bookings", { body: { action: "cancel", id: cancelB.id } });
    setCancelB(null);
    loadChild(kidId);
  };

  const Switcher = (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sub">My Children</span>
      {kids.map((k) => (
        <button
          key={k.id}
          onClick={() => setKidId(k.id)}
          className={`flex cursor-pointer items-center gap-2 rounded-full border-2 py-1 pl-1 pr-4 transition-all ${
            kidId === k.id ? "border-royal bg-royal text-white" : "border-line bg-white text-ink hover:border-royal/40"
          }`}
        >
          <Avatar name={k.name} size={28} hue={k.hue} rounded="rounded-full" />
          <span className="text-[12.5px] font-extrabold">{k.name}</span>
          <span className={`text-[11px] font-bold ${kidId === k.id ? "text-white/70" : "text-sub"}`}>
            {k.grade === 0 ? "K" : `Grade ${k.grade}`}
          </span>
        </button>
      ))}
      <button onClick={() => setAddOpen(true)} className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-royal/50 px-4 py-2 text-[12px] font-extrabold text-royal hover:bg-royal-soft">
        <Plus size={13} /> Add
      </button>
    </div>
  );

  const tabs: TabDef[] = [
    { id: "home", label: "Home", icon: Home, content: HomeTab() },
    { id: "children", label: "Children", icon: Users, content: ChildrenTab() },
    { id: "bookings", label: "Bookings", icon: CalendarDays, content: BookingsTab() },
    { id: "progress", label: "Progress", icon: TrendingUp, content: ProgressTab() },
    { id: "account", label: "Account", icon: User, content: AccountTab() },
  ];

  return <PortalShell expected="parent" roleLabel="Parent" tabs={tabs} />;

  function HomeTab() {
    return (
      <div>
        {Switcher}
        <PageHead
          title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${me.name.split(" ")[0]}`}
          sub={kid ? `Here's how ${kid.name} is doing this week.` : "Select a child to see their overview."}
          action={<Button href="/book" variant="accent" size="sm">+ Book a session</Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={CalendarDays} label="Next session" value={next ? fmtDate(next.scheduledAt) : "—"} sub={next ? `${next.subject} · ${fmtTime(next.scheduledAt)}` : "none scheduled"} tone="royal" />
          <Stat icon={GraduationCap} label="Attendance" value={`${attendance}%`} sub={`${attended} sessions attended`} tone="green" />
          <Stat icon={TrendingUp} label="Progress" value={kid ? `${overall}%` : "—"} sub="across 5 subjects" tone="amber" />
          <Stat icon={Receipt} label="Total paid" value={money(totalPaid)} sub={`${pays.length} payments`} tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-navy px-6 py-5">
                <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber anim-pulse-dot" /> {kid?.name}'s next session
                </span>
                {next ? (
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Avatar name={next.tutor?.name ?? ""} photo={next.tutor?.photo} size={52} rounded="rounded-full" />
                    <div className="flex-1">
                      <div className="font-display text-[17px] font-bold text-white capitalize">{next.subject} with {next.tutor?.name}</div>
                      <div className="text-[13px] font-semibold text-white/60">{fmtDateLong(next.scheduledAt)} · {fmtTime(next.scheduledAt)} · {next.durationMin} min</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" href={`/book?student=${kidId}`} variant="light">+ Another</Button>
                      <Button size="sm" variant="accent" onClick={() => setResched(next)}><RotateCcw size={13} /> Move</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[13.5px] font-semibold text-white/70">No upcoming sessions for {kid?.name}.</p>
                    <Button href="/book" variant="accent" size="sm">Book now</Button>
                  </div>
                )}
              </div>
            </Card>

            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold">Recent activity — {kid?.name}</h2>
                <Link href="/lessons" className="inline-flex items-center gap-1 text-[13px] font-bold text-royal hover:underline">Lesson library <ArrowRight size={13} /></Link>
              </div>
              <div className="space-y-2.5">
                {lessons.filter((l) => (l.percent ?? 0) > 0).slice(0, 3).map((l) => (
                  <Card key={l.id} className="flex items-center gap-4 p-4">
                    <SubjectIcon slug={l.subject} withBg size={17} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold">{l.title}</div>
                      <div className="text-[11.5px] font-semibold text-sub">Recorded lesson · {l.percent}% complete</div>
                    </div>
                    <ProgressBar value={l.percent ?? 0} color="#E8962E" size="sm" className="w-28" />
                    <Play size={15} className="cursor-pointer text-royal" />
                  </Card>
                ))}
                {notes.slice(0, 1).map((n) => (
                  <Card key={n.id} className="flex items-start gap-4 border-l-4 border-l-amber p-4">
                    <MessageSquare size={16} className="mt-0.5 text-amber-deep" />
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-sub">Tutor feedback · {n.tutor?.name}</div>
                      <p className="mt-1 text-[13px] font-semibold leading-relaxed text-ink/85">{n.summary}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-[16px] font-bold">Progress snapshot</h2>
              <div className="space-y-3.5">
                {bySubject.map((s) => (
                  <div key={s.slug} className="flex items-center gap-3">
                    <span className="w-18 text-[12.5px] font-bold text-sub" style={{ width: 70 }}>{s.name}</span>
                    <ProgressBar value={s.avg} color={s.color} size="sm" className="flex-1" />
                    <span className="w-10 text-right text-[12.5px] font-extrabold">{s.avg}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-cream p-4 text-[12.5px] font-semibold text-sub">
                <span className="font-extrabold text-ink">Tip: </span>
                Focus this week on {bySubject.reduce((a, b) => (a.avg < b.avg ? a : b)).name} — it's the lowest area right now.
              </div>
            </Card>
            <Card className="bg-navy p-6 text-white">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber" />
                <h3 className="font-display text-[15px] font-bold">You're always in the loop</h3>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
                Session reminders, tutor notes, attendance, and payments — everything about{" "}
                {kid?.name ?? "your child"} reaches you the moment it happens.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function ChildrenTab() {
    return (
      <div>
        <PageHead title="My Children" sub="Manage your students — add a sibling, view each child's record, and switch between them anytime." action={<Button size="sm" variant="accent" onClick={() => setAddOpen(true)}><Plus size={14} /> Add student</Button>} />
        <div className="grid gap-5 md:grid-cols-2">
          {kids.map((k) => {
            const isSel = k.id === kidId;
            return (
              <Card key={k.id} lift className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar name={k.name} size={56} hue={k.hue} rounded="rounded-2xl" />
                  <div className="flex-1">
                    <div className="font-display text-[17px] font-bold">{k.name}</div>
                    <div className="text-[12.5px] font-semibold text-sub">{k.grade === 0 ? "Kindergarten" : `Grade ${k.grade}`} · {k.guardian}</div>
                  </div>
                  {isSel ? <Badge tone="blue" dot>Selected</Badge> : (
                    <Button size="sm" variant="outline" onClick={() => setKidId(k.id)}>View</Button>
                  )}
                </div>
                {isSel && (
                  <div className="mt-5 space-y-3">
                    {bySubject.map((s) => (
                      <div key={s.slug} className="flex items-center gap-3">
                        <span className="w-16 text-[12px] font-bold text-sub">{s.name}</span>
                        <ProgressBar value={s.avg} color={s.color} size="sm" className="flex-1" />
                        <span className="w-9 text-right text-[12px] font-extrabold">{s.avg}%</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-line pt-3 text-[12.5px] font-bold">
                      <span className="text-sub">{upcoming.length} upcoming · {attended} attended</span>
                      <span className="text-royal">Overall {overall}%</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a student"
          footer={<>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addKid} disabled={!addForm.name || adding}>{adding ? "Adding…" : "Add student"}</Button>
          </>}>
          <div className="space-y-4">
            <Field label="Student name">
              <Input placeholder="e.g. Lily Rivera" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </Field>
            <Field label="Grade">
              <Select value={addForm.grade} onChange={(e) => setAddForm({ ...addForm, grade: Number(e.target.value) })}>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Select>
            </Field>
            <p className="rounded-lg bg-cream px-4 py-3 text-[12px] font-semibold text-sub">
              A new student account is created instantly. You can book their first session right away.
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  function BookingsTab() {
    return (
      <div>
        {Switcher}
        <PageHead title="Bookings & Payments" sub={`All sessions and transactions for ${kid?.name}.`} action={<Button href="/book" size="sm" variant="accent">+ Book session</Button>} />

        <h2 className="mb-3 font-display text-[16px] font-bold">Upcoming ({upcoming.length})</h2>
        <div className="space-y-3">
          {upcoming.length === 0 && <EmptyState icon={CalendarDays} title="No upcoming sessions" sub={`Book a session for ${kid?.name}.`} action={<Button size="sm" href="/book">Book now</Button>} />}
          {upcoming.map((b) => (
            <Card key={b.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-royal-soft text-center">
                <div>
                  <div className="font-display text-[17px] font-extrabold leading-none text-royal-deep">{new Date(b.scheduledAt).getDate()}</div>
                  <div className="text-[10px] font-extrabold uppercase text-royal-deep/60">{dayShort(b.scheduledAt)}</div>
                </div>
              </div>
              <Avatar name={b.tutor?.name ?? ""} photo={b.tutor?.photo} size={42} rounded="rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-bold capitalize">{b.subject} · {b.kind === "group" ? "Group" : "1-on-1"}</div>
                <div className="text-[12.5px] font-semibold text-sub">{b.tutor?.name} · {fmtDateLong(b.scheduledAt)} · {fmtTime(b.scheduledAt)}</div>
              </div>
              <span className="text-[14px] font-extrabold">{money(b.price)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setResched(b); setRDay(""); setRTime(""); }}><RotateCcw size={13} /> Move</Button>
                <Button size="sm" variant="ghost" className="text-clay" onClick={() => setCancelB(b)}><XCircle size={13} /> Cancel</Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-royal" />
              <h2 className="font-display text-[16px] font-bold">Payment history</h2>
            </div>
            <T>
              <thead><tr><Th>Invoice</Th><Th>Description</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th /></tr></thead>
              <tbody>
                {pays.map((p) => (
                  <Tr key={p.id}>
                    <Td><span className="font-mono text-[12px] font-bold">{p.invoiceNo}</span></Td>
                    <Td><span className="line-clamp-1 max-w-[240px] text-[13px] font-semibold">{p.label}</span></Td>
                    <Td className="whitespace-nowrap text-[13px] text-sub">{fmtDate(p.date)}</Td>
                    <Td className="text-right font-extrabold">{money(p.amount)}</Td>
                    <Td><Badge tone={p.status === "paid" ? "green" : "red"}>{p.status}</Badge></Td>
                    <Td><span className="cursor-pointer text-royal hover:underline"><Download size={14} /></span></Td>
                  </Tr>
                ))}
                {pays.length === 0 && <Tr><Td className="py-8 text-center text-sub" colSpan={6}>No payments yet.</Td></Tr>}
              </tbody>
            </T>
          </div>
          <div className="space-y-4">
            <Card className="bg-navy p-6 text-white">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber">Total paid</div>
              <div className="mt-1 font-display text-[30px] font-extrabold">{money(totalPaid)}</div>
              <div className="mt-1 text-[12px] font-semibold text-white/60">{pays.length} transactions · all paid</div>
            </Card>
            <Card className="p-5 text-[12.5px] font-semibold leading-relaxed text-sub">
              <Receipt size={15} className="mb-2 text-royal" />
              Need an official invoice for a package or class fee? Click the download icon on any transaction — PDFs are generated instantly.
            </Card>
          </div>
        </div>

        <h2 className="mb-3 mt-10 font-display text-[16px] font-bold">Past sessions ({past.length})</h2>
        <div className="space-y-2.5">
          {past.slice(0, 6).map((b) => (
            <Card key={b.id} className="flex items-center gap-4 p-4">
              <FileText size={16} className={b.status === "cancelled" ? "text-clay" : "text-leaf"} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold capitalize">{b.subject} with {b.tutor?.name}</div>
                <div className="text-[12px] font-semibold text-sub">{fmtDate(b.scheduledAt)} · {fmtTime(b.scheduledAt)} · ref {b.ref}</div>
              </div>
              <Badge tone={b.status === "cancelled" ? "red" : "green"}>{b.status}</Badge>
              <span className="text-[13px] font-extrabold">{money(b.price)}</span>
            </Card>
          ))}
        </div>

        <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule session"
          footer={<>
            <Button variant="outline" onClick={() => setResched(null)}>Keep time</Button>
            <Button onClick={doReschedule} disabled={!rDay || !rTime}>Confirm new time</Button>
          </>}>
          <div className="space-y-4">
            <Field label="New date">
              <Select value={rDay} onChange={(e) => setRDay(e.target.value)}>
                <option value="">Choose a date</option>
                {Array.from({ length: 10 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return <option key={iso} value={iso}>{fmtDateLong(d)}</option>; })}
              </Select>
            </Field>
            <Field label="New time">
              <Select value={rTime} onChange={(e) => setRTime(e.target.value)}>
                <option value="">Choose a time</option>
                {["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
        </Modal>

        <Modal open={!!cancelB} onClose={() => setCancelB(null)} title="Cancel this session?"
          footer={<>
            <Button variant="outline" onClick={() => setCancelB(null)}>Keep session</Button>
            <Button variant="danger" onClick={doCancel}>Yes, cancel</Button>
          </>}>
          <p className="text-[14px] font-semibold text-sub">
            Cancel <strong className="text-ink capitalize">{cancelB?.subject}</strong> on {cancelB ? fmtDateLong(cancelB.scheduledAt) : ""} at {cancelB ? fmtTime(cancelB.scheduledAt) : ""}? The fee will be fully refunded.
          </p>
        </Modal>
      </div>
    );
  }

  function ProgressTab() {
    return (
      <div>
        {Switcher}
        <PageHead title={`Progress — ${kid?.name ?? ""}`} sub="Subject-level progress, attendance, and what the tutor recommends working on." />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h2 className="mb-5 font-display text-[16px] font-bold">Progress by subject</h2>
            <div className="space-y-5">
              {bySubject.map((s) => (
                <div key={s.slug}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5 text-[13.5px] font-bold">
                      <SubjectIcon slug={s.slug} size={16} className="text-ink/70" /> {s.name}
                    </span>
                    <span className="font-display text-[15px] font-extrabold" style={{ color: s.color }}>{s.avg}%</span>
                  </div>
                  <ProgressBar value={s.avg} color={s.color} size="lg" />
                </div>
              ))}
            </div>
          </Card>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Stat icon={GraduationCap} label="Attendance" value={`${attendance}%`} tone="royal" />
              <Stat icon={Play} label="Lessons done" value={lessons.filter((l) => (l.percent ?? 0) === 100).length} tone="green" />
            </div>
            <Card className="p-6">
              <h2 className="mb-4 font-display text-[15px] font-bold">Areas for improvement</h2>
              <div className="space-y-3">
                {(notes.length ? notes.slice(0, 2) : [{ id: 0, focus: "Word problems", practice: "10 problems daily", summary: "", tutor: null, createdAt: "" }]).map((n, i) => (
                  <div key={i} className="rounded-xl border border-line bg-cream p-4">
                    <div className="text-[13px] font-extrabold">{n.focus}</div>
                    <p className="mt-1 text-[12px] font-semibold text-sub">Recommended: {n.practice}</p>
                  </div>
                ))}
              </div>
            </Card>
            {notes[0] && (
              <Card className="border-l-4 border-l-amber p-5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-sub">Latest tutor note</div>
                <p className="mt-2 text-[13px] font-semibold leading-relaxed text-ink/85">{notes[0].summary}</p>
                <div className="mt-2.5 text-[12px] font-extrabold text-sub">— {notes[0].tutor?.name} · {fmtDate(notes[0].createdAt)}</div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  function AccountTab() {
    return (
      <div>
        <PageHead title="Account & Settings" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <h2 className="font-display text-[16px] font-bold">Family account</h2>
            <div className="mt-5 flex items-center gap-4">
              <Avatar name={me.name} size={56} hue={265} rounded="rounded-2xl" />
              <div>
                <div className="font-display text-[17px] font-extrabold">{me.name}</div>
                <div className="text-[13px] font-semibold text-sub">maria.rivera@example.com · (555) 019-2841</div>
              </div>
            </div>
            <div className="mt-6 divide-y divide-line">
              {[
                ["Plan", "Family Monthly · $129/mo"],
                ["Students", `${kids.length} enrolled`],
                ["Member since", "September 2025"],
                ["Payment method", "Visa ···· 4242"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3.5 text-[13.5px]">
                  <span className="font-bold text-sub">{k}</span><span className="font-extrabold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-7">
            <h2 className="font-display text-[16px] font-bold">Notifications & privacy</h2>
            <div className="mt-5 space-y-5">
              <Toggle on={prefs.rem} onChange={(v) => setPrefs({ ...prefs, rem: v })} label="Session reminders (1 hour before)" />
              <Toggle on={prefs.weekly} onChange={(v) => setPrefs({ ...prefs, weekly: v })} label="Weekly progress email (Fridays)" />
              <Toggle on={prefs.receipts} onChange={(v) => setPrefs({ ...prefs, receipts: v })} label="Payment receipts" />
            </div>
            <div className="mt-7 rounded-xl bg-cream p-4 text-[12.5px] font-semibold text-sub">
              <Shield size={14} className="mb-1.5 text-leaf" />
              Student data is never shared outside your family account and assigned tutors.
            </div>
          </Card>
        </div>
      </div>
    );
  }
}

function t24(t: string) {
  const [hm, ap] = t.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
