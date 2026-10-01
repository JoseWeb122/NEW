"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalShell, PageHead, Loading, type TabDef } from "@/components/shell";
import {
  Card,
  Button,
  Badge,
  Avatar,
  Stat,
  ProgressBar,
  Ring,
  SubjectIcon,
  Modal,
  Select,
  Field,
  EmptyState,
  Toggle,
} from "@/components/ui";
import type { LessonLite } from "@/components/cards";
import { SUBJECTS, LEVELS } from "@/lib/const";
import { api, useAuth, money, fmtDate, fmtDateLong, fmtTime, dayShort, addDays, isoDay } from "@/lib/client";
import {
  Home,
  BookOpen,
  CalendarDays,
  TrendingUp,
  User,
  Play,
  Clock,
  Check,
  Flame,
  ClipboardList,
  ArrowRight,
  Video,
  Sparkles,
  FileText,
  MessageSquare,
  CalendarClock,
  RotateCcw,
  XCircle,
  GraduationCap,
  Star,
} from "lucide-react";

type Booking = {
  id: number;
  ref: string;
  subject: string;
  kind: string;
  scheduledAt: string;
  durationMin: number;
  price: number;
  status: string;
  tutor: { name: string; photo: string | null } | null;
};
type Assignment = {
  id: number;
  title: string;
  subject: string;
  kind: string;
  dueAt: string;
  status: string;
  score: number | null;
  feedback: string | null;
};
type Note = { id: number; summary: string; focus: string; practice: string; createdAt: string; tutor: { name: string } | null };

export default function StudentPortal() {
  const { user } = useAuth();
  const sid = user?.id ?? 1;
  const [student, setStudent] = useState<{ id: number; name: string; grade: number; guardian: string; hue: number } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lessons, setLessons] = useState<(LessonLite & { addedAt: string; popularity: number })[]>([]);
  const [assigns, setAssigns] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [resched, setResched] = useState<Booking | null>(null);
  const [cancelB, setCancelB] = useState<Booking | null>(null);
  const [rDay, setRDay] = useState("");
  const [rTime, setRTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState({ rem: true, news: true, report: true });

  const load = useCallback(() => {
    Promise.all([
      api(`/api/students?id=${sid}`),
      api(`/api/bookings?studentId=${sid}`),
      api(`/api/lessons?studentId=${sid}`),
      api(`/api/assignments?studentId=${sid}`),
      api(`/api/notes?studentId=${sid}`),
    ]).then(([s, b, l, a, n]) => {
      setStudent(s[0] ?? null);
      setBookings(b);
      setLessons(l);
      setAssigns(a);
      setNotes(n);
      setLoaded(true);
    });
  }, [sid]);

  useEffect(load, [load]);

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === "upcoming" && new Date(b.scheduledAt) > now);
  const past = bookings.filter((b) => new Date(b.scheduledAt) <= now || b.status === "cancelled").reverse();
  const next = upcoming[0];
  const inProgress = lessons.filter((l) => (l.percent ?? 0) > 0 && (l.percent ?? 0) < 100);
  const completedCount = lessons.filter((l) => (l.percent ?? 0) === 100).length;
  const doneAssigns = assigns.filter((a) => a.status === "done").length;
  const dueAssigns = assigns.filter((a) => a.status === "todo");

  const bySubject = SUBJECTS.map((s) => {
    const ls = lessons.filter((l) => l.subject === s.slug);
    const as = assigns.filter((a) => a.subject === s.slug);
    const vals = [
      ...ls.map((l) => l.percent ?? 0),
      ...as.map((a) => (a.status === "done" ? 100 : 0)),
    ];
    const avg = vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : 0;
    return { ...s, avg, count: ls.length + as.length };
  });
  const overall = Math.round(bySubject.reduce((a, s) => a + s.avg, 0) / bySubject.length);

  // streak: consecutive days from today with a lesson updated
  const streak = useMemo(() => {
    const days = new Set(
      lessons
        .filter((l) => (l.percent ?? 0) > 0)
        .map((l) => new Date(l.addedAt).toDateString())
    );
    // fallback: derive from booking dates
    bookings.forEach((b) => days.add(new Date(b.scheduledAt).toDateString()));
    let c = 0;
    for (let i = 0; i < 30; i++) {
      if (days.has(addDays(now, -i).toDateString())) c++;
      else if (i > 0) break;
    }
    return Math.max(c, 3);
  }, [lessons, bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded || !user) return <PortalShell expected="student" roleLabel="Student" tabs={[{ id: "x", label: "…", icon: Home, content: <Loading /> }]} />;
  const me = user;

  const completeAssign = (id: number) =>
    api("/api/assignments", { body: { action: "complete", id } }).then(() => load());

  const doReschedule = async () => {
    if (!resched || !rDay || !rTime) return;
    setBusy(true);
    await api("/api/bookings", {
      body: { action: "reschedule", id: resched.id, scheduledAt: new Date(`${rDay}T${t24(rTime)}:00`).toISOString() },
    });
    setBusy(false);
    setResched(null);
    load();
  };

  const doCancel = async () => {
    if (!cancelB) return;
    setBusy(true);
    await api("/api/bookings", { body: { action: "cancel", id: cancelB.id } });
    setBusy(false);
    setCancelB(null);
    load();
  };

  const tabs: TabDef[] = [
    { id: "home", label: "Home", icon: Home, content: HomeTab() },
    { id: "learn", label: "Learn", icon: BookOpen, content: LearnTab() },
    { id: "sessions", label: "Sessions", icon: CalendarDays, content: SessionsTab() },
    { id: "progress", label: "Progress", icon: TrendingUp, content: ProgressTab() },
    { id: "profile", label: "Profile", icon: User, content: ProfileTab() },
  ];

  return <PortalShell expected="student" roleLabel="Student" tabs={tabs} />;

  /* ---------------- tabs ---------------- */

  function HomeTab() {
    const firstName = student?.name.split(" ")[0] ?? "there";
    return (
      <div>
        <PageHead
          title={`Welcome back, ${firstName}! 👋`.replace(" 👋", "")}
          sub={`${student ? (student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`) : ""} · ${LEVELS.find((l) => student && student.grade >= l.gradeRange[0] && student.grade <= l.gradeRange[1])?.name ?? ""}`}
          action={<Button href="/book" variant="accent" size="sm">+ Book a session</Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Check} label="Lessons completed" value={completedCount} sub={`of ${lessons.length} in library`} tone="green" />
          <Stat icon={ClipboardList} label="Assignments done" value={`${doneAssigns}/${assigns.length}`} sub={`${dueAssigns.length} due soon`} tone="amber" />
          <Stat icon={Flame} label="Learning streak" value={`${streak} days`} sub="Keep it going!" tone="royal" />
          <Stat icon={TrendingUp} label="Overall progress" value={`${overall}%`} sub="across 5 subjects" tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* next session */}
            <Card className="overflow-hidden">
              <div className="bg-navy px-6 py-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber anim-pulse-dot" /> Next session
                  </span>
                  {next && (
                    <Badge tone="navy" className="border border-white/15">
                      {fmtDate(next.scheduledAt)} · {fmtTime(next.scheduledAt)}
                    </Badge>
                  )}
                </div>
                {next ? (
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Avatar name={next.tutor?.name ?? ""} photo={next.tutor?.photo} size={54} rounded="rounded-full" />
                    <div className="flex-1">
                      <div className="font-display text-[18px] font-bold text-white capitalize">{next.subject} with {next.tutor?.name}</div>
                      <div className="text-[13px] font-semibold text-white/60">
                        {next.kind === "group" ? "Group session" : "1-on-1"} · {next.durationMin} min · {fmtDateLong(next.scheduledAt)}
                      </div>
                    </div>
                    <Button href={`/live?subject=${next.subject}&tutor=${(next.tutor?.name ?? "").replace(/ /g, "_")}`} variant="accent">
                      <Video size={15} /> Join Session
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[13.5px] font-semibold text-white/70">No upcoming sessions — book your next one.</p>
                    <Button href="/book" variant="accent" size="sm">Book now</Button>
                  </div>
                )}
              </div>
            </Card>

            {/* continue learning */}
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold">Continue learning</h2>
                <Link href="/lessons" className="inline-flex items-center gap-1 text-[13px] font-bold text-royal hover:underline">
                  Library <ArrowRight size={13} />
                </Link>
              </div>
              {inProgress.length === 0 ? (
                <EmptyState icon={Play} title="Nothing in progress" sub="Pick a recorded lesson from the library to start." action={<Button href="/lessons" size="sm">Browse lessons</Button>} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {inProgress.slice(0, 4).map((l) => (
                    <Link key={l.id} href={`/lessons?watch=${l.id}`}>
                      <Card lift className="p-4">
                        <div className="flex items-center gap-3">
                          <SubjectIcon slug={l.subject} withBg size={18} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-bold">{l.title}</div>
                            <div className="text-[11.5px] font-semibold text-sub">{l.durationMin} min · {l.percent ?? 0}% watched</div>
                          </div>
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-royal text-white"><Play size={14} className="ml-0.5 fill-white" /></span>
                        </div>
                        <ProgressBar value={l.percent ?? 0} color="#E8962E" size="sm" className="mt-3" />
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* assignments due */}
            <div>
              <h2 className="mb-3.5 font-display text-[17px] font-bold">Assignments due</h2>
              <div className="space-y-2.5">
                {dueAssigns.length === 0 && (
                  <Card className="p-5 text-center text-[13px] font-bold text-leaf">All caught up — nothing due! 🎉</Card>
                )}
                {dueAssigns.slice(0, 3).map((a) => (
                  <Card key={a.id} className="flex items-center gap-4 p-4">
                    <SubjectIcon slug={a.subject} withBg size={17} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold">{a.title}</div>
                      <div className="text-[11.5px] font-semibold text-sub capitalize">{a.kind} · due {fmtDate(a.dueAt)}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => completeAssign(a.id)}>
                      <Check size={13} /> Mark complete
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="space-y-6">
            <Card className="flex flex-col items-center p-6">
              <div className="label mb-1">Overall progress</div>
              <Ring value={overall} size={140} stroke={12} sub="5 subjects" />
              <div className="mt-5 w-full space-y-3">
                {bySubject.slice(0, 3).map((s) => (
                  <div key={s.slug} className="flex items-center gap-3">
                    <span className="w-20 text-[12px] font-bold text-sub">{s.name}</span>
                    <ProgressBar value={s.avg} color={s.color} size="sm" className="flex-1" />
                    <span className="w-9 text-right text-[12px] font-extrabold">{s.avg}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-royal" />
                <h3 className="font-display text-[15px] font-bold">Latest tutor feedback</h3>
              </div>
              {notes[0] ? (
                <div className="mt-4 rounded-xl border-l-4 border-amber bg-amber-soft/60 p-4">
                  <p className="text-[13px] font-semibold leading-relaxed text-ink/85">{notes[0].summary}</p>
                  <div className="mt-3 text-[12px] font-extrabold text-sub">
                    — {notes[0].tutor?.name ?? "Your tutor"} · {fmtDate(notes[0].createdAt)}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[13px] font-semibold text-sub">Feedback appears here after your next session.</p>
              )}
            </Card>

            <Card className="bg-royal p-6 text-white">
              <Sparkles size={18} className="text-amber" />
              <h3 className="mt-2 font-display text-[16px] font-bold">Recommended for you</h3>
              <p className="mt-1 text-[12.5px] font-semibold text-white/70">
                Based on your Grade {student?.grade} level and recent activity.
              </p>
              {lessons.filter((l) => l.percent === 0 && l.grade === (student?.grade ?? 4)).slice(0, 2).map((l) => (
                <Link key={l.id} href={`/lessons?watch=${l.id}`} className="mt-3 flex items-center gap-3 rounded-xl bg-white/10 p-3 hover:bg-white/15">
                  <Play size={15} className="fill-white text-white" />
                  <span className="flex-1 truncate text-[12.5px] font-bold">{l.title}</span>
                  <span className="text-[11px] font-bold text-white/60">{l.durationMin}m</span>
                </Link>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function LearnTab() {
    return (
      <div>
        <PageHead title="My Learning" sub="Your five subjects, current progress, and everything you should work on next." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {bySubject.map((s) => (
            <Card key={s.slug} lift className="p-5">
              <SubjectIcon slug={s.slug} withBg size={20} />
              <h3 className="mt-3 font-display text-[15px] font-bold">{s.name}</h3>
              <div className="mt-1 text-[11.5px] font-semibold text-sub">{s.count} items · {s.avg}%</div>
              <ProgressBar value={s.avg} color={s.color} size="sm" className="mt-3" />
              <Link href={`/lessons?subject=${s.slug}`} className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-extrabold text-royal hover:underline">
                Continue <ArrowRight size={12} />
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3.5 font-display text-[17px] font-bold">All assignments</h2>
            <div className="space-y-2.5">
              {assigns.map((a) => (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start gap-3.5">
                    <SubjectIcon slug={a.subject} withBg size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-bold">{a.title}</span>
                        <Badge tone={a.status === "done" ? "green" : "amber"}>{a.status === "done" ? "Completed" : "In progress"}</Badge>
                      </div>
                      <div className="mt-1 text-[11.5px] font-semibold text-sub capitalize">
                        {a.kind} · due {fmtDate(a.dueAt)}
                        {a.score != null && <span className="text-leaf"> · scored {a.score}/100</span>}
                      </div>
                      {a.feedback && a.status === "done" && (
                        <p className="mt-2 rounded-lg bg-royal-soft px-3 py-2 text-[12px] font-semibold text-royal-deep">
                          “{a.feedback}”
                        </p>
                      )}
                    </div>
                    {a.status === "todo" ? (
                      <Button size="sm" variant="outline" onClick={() => completeAssign(a.id)}>
                        <Check size={13} /> Complete
                      </Button>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf-soft text-leaf"><Check size={14} /></span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3.5 font-display text-[17px] font-bold">Recently completed lessons</h2>
            <div className="space-y-2.5">
              {lessons
                .filter((l) => l.percent === 100)
                .slice(0, 5)
                .map((l) => (
                  <Card key={l.id} className="flex items-center gap-3.5 p-4">
                    <SubjectIcon slug={l.subject} withBg size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold">{l.title}</div>
                      <div className="text-[11.5px] font-semibold text-sub capitalize">{l.subject} · {l.durationMin} min</div>
                    </div>
                    <Badge tone="green">100%</Badge>
                  </Card>
                ))}
              {lessons.filter((l) => l.percent === 100).length === 0 && (
                <Card className="p-6 text-center text-[13px] font-semibold text-sub">Completed lessons will appear here.</Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SessionsTab() {
    return (
      <div>
        <PageHead
          title="My Sessions"
          sub="Join live sessions, reschedule, or cancel — changes appear instantly in your parent's dashboard."
          action={<Button href="/book" size="sm" variant="accent">+ Book session</Button>}
        />
        <h2 className="mb-3 font-display text-[16px] font-bold">Upcoming ({upcoming.length})</h2>
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <EmptyState icon={CalendarClock} title="No upcoming sessions" sub="Book a session and it will show up here with a Join button." action={<Button size="sm" href="/book">Book now</Button>} />
          )}
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
                <div className="text-[12.5px] font-semibold text-sub">
                  {b.tutor?.name} · {fmtDateLong(b.scheduledAt)} · {fmtTime(b.scheduledAt)} · {b.durationMin} min
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" href={`/live?subject=${b.subject}&tutor=${(b.tutor?.name ?? "").replace(/ /g, "_")}`} variant="primary">
                  <Video size={13} /> Join
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setResched(b); setRDay(""); setRTime(""); }}>
                  <RotateCcw size={13} /> Reschedule
                </Button>
                <Button size="sm" variant="ghost" className="text-clay" onClick={() => setCancelB(b)}>
                  <XCircle size={13} /> Cancel
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 mt-8 font-display text-[16px] font-bold">History ({past.length})</h2>
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

        {/* reschedule modal */}
        <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule session"
          footer={<>
            <Button variant="outline" onClick={() => setResched(null)}>Keep current time</Button>
            <Button onClick={doReschedule} disabled={!rDay || !rTime || busy}>{busy ? "Saving…" : "Confirm new time"}</Button>
          </>}>
          {resched && (
            <div className="space-y-4">
              <p className="text-[13.5px] font-semibold text-sub">
                Moving your <strong className="text-ink capitalize">{resched.subject}</strong> session with {resched.tutor?.name}.
              </p>
              <Field label="New date">
                <Select value={rDay} onChange={(e) => setRDay(e.target.value)}>
                  <option value="">Choose a date</option>
                  {Array.from({ length: 10 }, (_, i) => addDays(new Date(), i + 1)).map((d) => (
                    <option key={isoDay(d)} value={isoDay(d)}>{fmtDateLong(d)}</option>
                  ))}
                </Select>
              </Field>
              <Field label="New time">
                <Select value={rTime} onChange={(e) => setRTime(e.target.value)}>
                  <option value="">Choose a time</option>
                  {["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </Modal>

        {/* cancel confirm */}
        <Modal open={!!cancelB} onClose={() => setCancelB(null)} title="Cancel this session?"
          footer={<>
            <Button variant="outline" onClick={() => setCancelB(null)}>Keep session</Button>
            <Button variant="danger" onClick={doCancel} disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel"}</Button>
          </>}>
          <p className="text-[14px] font-semibold text-sub">
            This cancels your <strong className="text-ink capitalize">{cancelB?.subject}</strong> session on{" "}
            {cancelB ? fmtDateLong(cancelB.scheduledAt) : ""} at {cancelB ? fmtTime(cancelB.scheduledAt) : ""}. The full fee is refunded to your account.
          </p>
        </Modal>
      </div>
    );
  }

  function ProgressTab() {
    const attended = past.filter((b) => b.status !== "cancelled").length;
    const total = past.length;
    const attendance = total ? Math.round((attended / total) * 100) : 100;
    return (
      <div>
        <PageHead title="My Progress" sub="How you're doing across all five subjects — updated after every lesson and session." />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-5 font-display text-[16px] font-bold">Subject progress</h2>
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
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat icon={Play} label="Lessons completed" value={completedCount} tone="green" />
              <Stat icon={ClipboardList} label="Assignments" value={`${doneAssigns}/${assigns.length}`} tone="amber" />
              <Stat icon={GraduationCap} label="Attendance" value={`${attendance}%`} tone="royal" />
            </div>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 font-display text-[15px] font-bold">Skills mastered</h2>
              <div className="flex flex-wrap gap-2">
                {["Sight words 200+", "Fractions", "Multiplication tables", "Reading fluency", "Roots & suffixes", "Parts of speech"].map((sk) => (
                  <Badge key={sk} tone="green" dot>{sk}</Badge>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 font-display text-[15px] font-bold">Focus areas</h2>
              <div className="space-y-3">
                {(notes.length ? notes : [{ focus: "Word problems in fractions", practice: "15 min daily", id: 0 }]).slice(0, 3).map((n, i) => (
                  <div key={i} className="rounded-xl border border-line bg-cream p-4">
                    <div className="flex items-center gap-2 text-[13px] font-extrabold">
                      <Star size={13} className="fill-amber text-amber" /> {n.focus}
                    </div>
                    <p className="mt-1.5 text-[12px] font-semibold text-sub">Practice: {n.practice}</p>
                  </div>
                ))}
              </div>
            </Card>
            {notes[0] && (
              <Card className="p-6">
                <h2 className="mb-3 font-display text-[15px] font-bold">Tutor feedback</h2>
                <p className="text-[13px] font-semibold leading-relaxed text-ink/85">{notes[0].summary}</p>
                <div className="mt-3 text-[12px] font-extrabold text-sub">— {notes[0].tutor?.name}</div>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  function ProfileTab() {
    return (
      <div>
        <PageHead title="My Profile" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-center gap-5">
              <Avatar name={student?.name ?? me.name} size={72} hue={student?.hue} rounded="rounded-2xl" />
              <div>
                <div className="font-display text-[20px] font-extrabold">{student?.name ?? me.name}</div>
                <div className="mt-1 text-[13.5px] font-semibold text-sub">
                  {student?.grade === 0 ? "Kindergarten" : `Grade ${student?.grade}`} · Member since Fall 2025
                </div>
                <Badge tone="blue" className="mt-2">Monthly plan · Active</Badge>
              </div>
            </div>
            <div className="mt-6 divide-y divide-line">
              {[
                ["Guardian", student?.guardian ?? "—"],
                ["Contact email", "maria.rivera@example.com"],
                ["Home school", "Riverside Elementary"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3.5 text-[13.5px]">
                  <span className="font-bold text-sub">{k}</span>
                  <span className="font-extrabold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-7">
            <h2 className="font-display text-[16px] font-bold">Preferences</h2>
            <div className="mt-5 space-y-5">
              <Toggle on={prefs.rem} onChange={(v) => setPrefs({ ...prefs, rem: v })} label="Session reminders (1 hour before)" />
              <Toggle on={prefs.news} onChange={(v) => setPrefs({ ...prefs, news: v })} label="New lesson recommendations" />
              <Toggle on={prefs.report} onChange={(v) => setPrefs({ ...prefs, report: v })} label="Weekly progress report to my parent" />
            </div>
            <div className="mt-7 rounded-xl bg-cream p-4 text-[12.5px] font-semibold text-sub">
              Need help? Your parent can manage plan and billing from the parent dashboard.
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
