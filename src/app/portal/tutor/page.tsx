"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalShell, PageHead, Loading, type TabDef } from "@/components/shell";
import {
  Card, Button, Badge, Avatar, Stat, Modal, Field, Input, Select, Textarea,
  Toggle, EmptyState, Stars, ProgressBar,
} from "@/components/ui";
import type { TutorLite } from "@/components/cards";
import { SUBJECT_MAP, DAYS } from "@/lib/const";
import { api, useAuth, money, fmtDate, fmtDateLong, fmtTime, dayShort, addDays, isoDay } from "@/lib/client";
import {
  Home, Users, CalendarDays, Video, User,
  Clock, Check, Plus, NotebookPen, Star, Save, ExternalLink,
  RotateCcw, XCircle, GraduationCap, TrendingUp,
} from "lucide-react";

type Booking = {
  id: number; ref: string; subject: string; kind: string; scheduledAt: string;
  durationMin: number; price: number; status: string; notes: string | null;
  student: { id: number; name: string; grade: number; hue: number } | null;
};
type Note = { id: number; studentId: number; summary: string; focus: string; practice: string; createdAt: string; student: { name: string; grade: number; hue: number } | null };

export default function TutorPortal() {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<TutorLite | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allStudents, setAllStudents] = useState<{ id: number; name: string; grade: number; hue: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [studentOpen, setStudentOpen] = useState<number | null>(null);
  const [noteForm, setNoteForm] = useState({ summary: "", focus: "", practice: "" });
  const [savingNote, setSavingNote] = useState(false);
  const [resched, setResched] = useState<Booking | null>(null);
  const [cancelB, setCancelB] = useState<Booking | null>(null);
  const [rDay, setRDay] = useState("");
  const [rTime, setRTime] = useState("");
  const [avail, setAvail] = useState<{ day: string; on: boolean; start: number; end: number }[]>([]);
  const [savingAvail, setSavingAvail] = useState(false);
  const [rates, setRates] = useState({ r30: 26, r60: 46 });
  const [weekOffset, setWeekOffset] = useState(0);

  const tid = user?.id ?? 1;

  const load = useCallback(() => {
    Promise.all([
      api("/api/tutors"),
      api(`/api/bookings?tutorId=${tid}`),
      api(`/api/notes?tutorId=${tid}`),
      api("/api/students"),
    ]).then(([t, b, n, s]) => {
      const me = (t as TutorLite[]).find((x) => x.id === tid) ?? null;
      setTutor(me);
      setBookings(b);
      setNotes(n);
      setAllStudents(s);
      if (me) {
        setRates({ r30: me.rate30, r60: me.rate60 });
        setAvail(DAYS.filter((d) => d !== "Sun").map((d) => ({
          day: d, on: me.days.includes(d), start: me.slotStart ?? 15, end: me.slotEnd ?? 20,
        })));
      }
      setLoaded(true);
    });
  }, [tid]);

  useEffect(load, [load]);

  const today = new Date().toDateString();
  const todays = bookings.filter((b) => new Date(b.scheduledAt).toDateString() === today && b.status === "upcoming");
  const upcoming = bookings.filter((b) => b.status === "upcoming" && new Date(b.scheduledAt) >= new Date());
  const past = bookings.filter((b) => new Date(b.scheduledAt) < new Date() || b.status === "cancelled").reverse();
  const myStudentIds = useMemo(
    () => new Set([...bookings.map((b) => b.student?.id).filter(Boolean), ...notes.map((n) => n.studentId)]),
    [bookings, notes]
  );
  const myStudents = allStudents.filter((s) => myStudentIds.has(s.id));

  if (!loaded || !user)
    return <PortalShell expected="tutor" roleLabel="Tutor" tabs={[{ id: "x", label: "…", icon: Home, content: <Loading /> }]} />;
  const me = user;

  const saveNote = async () => {
    if (!noteForm.summary || !studentOpen) return;
    setSavingNote(true);
    await api("/api/notes", { body: { tutorId: tid, studentId: studentOpen, ...noteForm } });
    setSavingNote(false);
    setNoteForm({ summary: "", focus: "", practice: "" });
    load();
  };

  const saveAvail = async () => {
    setSavingAvail(true);
    await api(`/api/tutors/${tutor?.slug}`, {
      body: { days: avail.filter((a) => a.on).map((a) => a.day), slotStart: avail[0].start, slotEnd: avail[0].end },
    });
    setSavingAvail(false);
    load();
  };

  const saveRates = async () => {
    await api(`/api/tutors/${tutor?.slug}`, { body: { rate30: rates.r30, rate60: rates.r60 } });
    load();
  };

  const doReschedule = async () => {
    if (!resched || !rDay || !rTime) return;
    await api("/api/bookings", { body: { action: "reschedule", id: resched.id, scheduledAt: new Date(`${rDay}T${t24(rTime)}:00`).toISOString() } });
    setResched(null);
    load();
  };
  const doCancel = async () => {
    if (!cancelB) return;
    await api("/api/bookings", { body: { action: "cancel", id: cancelB.id } });
    setCancelB(null);
    load();
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), weekOffset * 7 - ((new Date().getDay() + 6) % 7) + i);
    return d;
  });

  const tabs: TabDef[] = [
    { id: "home", label: "Home", icon: Home, content: HomeTab() },
    { id: "students", label: "Students", icon: Users, content: StudentsTab() },
    { id: "calendar", label: "Calendar", icon: CalendarDays, content: CalendarTab() },
    { id: "sessions", label: "Sessions", icon: Video, content: SessionsTab() },
    { id: "profile", label: "Profile", icon: User, content: ProfileTab() },
  ];

  return <PortalShell expected="tutor" roleLabel="Tutor" tabs={tabs} />;

  function HomeTab() {
    return (
      <div>
        <PageHead title={`Welcome, ${me.name.split(" ")[0]}`} sub={`${tutor?.title ?? ""} · ${tutor?.experienceYears ?? 0} years of experience`} action={<Button href={`/tutors/${tutor?.slug}`} variant="outline" size="sm"><ExternalLink size={13} /> Public profile</Button>} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Video} label="Today's sessions" value={todays.length} sub={todays[0] ? `next at ${fmtTime(todays[0].scheduledAt)}` : "day clear"} tone="royal" />
          <Stat icon={Users} label="Active students" value={myStudents.length} sub="currently coached" tone="green" />
          <Stat icon={CalendarDays} label="Upcoming" value={upcoming.length} sub="next 30 days" tone="amber" />
          <Stat icon={Star} label="Rating" value={tutor ? `${tutor.rating.toFixed(1)}` : "—"} sub={`${tutor?.reviewCount ?? 0} reviews`} tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div>
              <h2 className="mb-3.5 font-display text-[17px] font-bold">Today · {fmtDateLong(new Date())}</h2>
              <div className="space-y-3">
                {todays.length === 0 && (
                  <Card className="p-6 text-center text-[13.5px] font-semibold text-sub">
                    No sessions today. You have {upcoming.length} upcoming.
                  </Card>
                )}
                {todays.map((b) => (
                  <Card key={b.id} className="flex flex-wrap items-center gap-4 border-l-4 border-l-amber p-5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-amber-soft text-center">
                      <div>
                        <div className="font-display text-[15px] font-extrabold leading-none text-amber-deep">{fmtTime(b.scheduledAt)}</div>
                        <div className="text-[10px] font-extrabold uppercase text-amber-deep/60">{b.durationMin} min</div>
                      </div>
                    </div>
                    <Avatar name={b.student?.name ?? ""} size={42} hue={b.student?.hue} rounded="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-bold">{b.student?.name} · <span className="capitalize">{b.subject}</span></div>
                      <div className="text-[12.5px] font-semibold text-sub">
                        {b.student?.grade === 0 ? "Kindergarten" : `Grade ${b.student?.grade}`} · {b.kind === "group" ? "Group" : "1-on-1"}
                      </div>
                    </div>
                    <Button size="sm" variant="accent" href={`/live?subject=${b.subject}&tutor=${me.name.replace(/ /g, "_")}`}>
                      <Video size={13} /> Join
                    </Button>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold">Upcoming</h2>
                <button onClick={() => setWeekOffset(0)} className="text-[12.5px] font-bold text-royal hover:underline">View calendar</button>
              </div>
              <div className="space-y-2.5">
                {upcoming.slice(0, 4).map((b) => (
                  <Card key={b.id} className="flex items-center gap-4 p-4">
                    <Avatar name={b.student?.name ?? ""} size={38} hue={b.student?.hue} rounded="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold">{b.student?.name} · <span className="capitalize">{b.subject}</span></div>
                      <div className="text-[12px] font-semibold text-sub">{fmtDate(b.scheduledAt)} · {fmtTime(b.scheduledAt)} · {b.durationMin} min</div>
                    </div>
                    <button onClick={() => setResched(b)} className="cursor-pointer rounded-lg p-2 text-sub hover:bg-royal-soft hover:text-royal" aria-label="Reschedule"><RotateCcw size={14} /></button>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <NotebookPen size={16} className="text-royal" />
                <h2 className="font-display text-[15px] font-bold">Recent student notes</h2>
              </div>
              <div className="mt-4 space-y-3">
                {notes.slice(0, 3).map((n) => (
                  <button key={n.id} onClick={() => setStudentOpen(n.studentId)} className="block w-full cursor-pointer rounded-xl border border-line bg-cream p-4 text-left hover:border-royal/50">
                    <div className="text-[13px] font-extrabold">{n.student?.name}</div>
                    <p className="mt-1 line-clamp-2 text-[12.5px] font-semibold text-sub">{n.summary}</p>
                    <div className="mt-2 text-[11px] font-bold text-royal">Focus: {n.focus}</div>
                  </button>
                ))}
                {notes.length === 0 && <p className="text-[13px] font-semibold text-sub">No notes yet — add one after your first session.</p>}
              </div>
            </Card>
            <Card className="bg-navy p-6 text-white">
              <TrendingUp size={17} className="text-amber" />
              <h3 className="mt-2 font-display text-[15px] font-bold">This week at a glance</h3>
              <div className="mt-4 space-y-2.5 text-[13px] font-semibold">
                <div className="flex justify-between"><span className="text-white/60">Sessions completed</span><span className="font-extrabold">{past.slice(0, 7).filter((p) => p.status !== "cancelled").length}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Teaching hours</span><span className="font-extrabold">{Math.round(past.reduce((a, b) => a + b.durationMin, 0) / 60)}h</span></div>
                <div className="flex justify-between"><span className="text-white/60">Notes written</span><span className="font-extrabold">{notes.length}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function StudentsTab() {
    return (
      <div>
        <PageHead title="My Students" sub="Click a student to review their record and write session notes." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {myStudents.map((s) => {
            const nextB = upcoming.filter((b) => b.student?.id === s.id)[0];
            const sNotes = notes.filter((n) => n.studentId === s.id);
            const subjects = [...new Set(bookings.filter((b) => b.student?.id === s.id).map((b) => b.subject))];
            return (
              <Card key={s.id} lift onClick={() => setStudentOpen(s.id)} className="cursor-pointer p-5">
                <div className="flex items-center gap-3.5">
                  <Avatar name={s.name} size={48} hue={s.hue} rounded="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold">{s.name}</div>
                    <div className="text-[12px] font-semibold text-sub">{s.grade === 0 ? "Kindergarten" : `Grade ${s.grade}`}</div>
                  </div>
                  <Badge tone="blue">{sNotes.length} notes</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {subjects.length ? subjects.map((x) => <Badge key={x} tone="outline" className="capitalize">{SUBJECT_MAP[x]?.name ?? x}</Badge>) : <Badge tone="outline">New</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5 text-[12px] font-bold">
                  <span className="text-sub">Next session</span>
                  <span className="text-royal">{nextB ? `${fmtDate(nextB.scheduledAt)} · ${fmtTime(nextB.scheduledAt)}` : "—"}</span>
                </div>
              </Card>
            );
          })}
          {myStudents.length === 0 && <EmptyState icon={Users} title="No students yet" sub="Students appear here once you have a booking or note with them." />}
        </div>

        <Modal open={studentOpen != null} onClose={() => setStudentOpen(null)} wide title={
          <span className="flex items-center gap-3">
            <Avatar name={allStudents.find((s) => s.id === studentOpen)?.name ?? ""} size={38} hue={allStudents.find((s) => s.id === studentOpen)?.hue} rounded="rounded-full" />
            Student record — {allStudents.find((s) => s.id === studentOpen)?.name}
          </span>
        }>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="label">Session notes</h4>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {notes.filter((n) => n.studentId === studentOpen).map((n) => (
                  <div key={n.id} className="rounded-xl border border-line bg-cream p-4">
                    <p className="text-[13px] font-semibold leading-relaxed text-ink/85">{n.summary}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Badge tone="blue" dot>Focus: {n.focus}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] font-semibold text-sub">Practice: {n.practice}</p>
                    <div className="mt-2 text-[11px] font-bold text-sub/70">{fmtDate(n.createdAt)}</div>
                  </div>
                ))}
                {notes.filter((n) => n.studentId === studentOpen).length === 0 && (
                  <p className="rounded-xl border border-dashed border-line p-5 text-center text-[12.5px] font-semibold text-sub">No notes for this student yet.</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="label">Add a session note</h4>
              <div className="space-y-3.5">
                <Field label="Session summary">
                  <Textarea rows={3} placeholder="What we covered and how it went…" value={noteForm.summary} onChange={(e) => setNoteForm({ ...noteForm, summary: e.target.value })} />
                </Field>
                <Field label="Focus area (improvement needed)">
                  <Input placeholder="e.g. Multi-digit multiplication" value={noteForm.focus} onChange={(e) => setNoteForm({ ...noteForm, focus: e.target.value })} />
                </Field>
                <Field label="Recommended practice">
                  <Input placeholder="e.g. 10 problems daily before Friday" value={noteForm.practice} onChange={(e) => setNoteForm({ ...noteForm, practice: e.target.value })} />
                </Field>
                <Button variant="primary" className="w-full" disabled={!noteForm.summary || savingNote} onClick={saveNote}>
                  <Save size={14} /> {savingNote ? "Saving…" : "Save note (visible to parent)"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  function CalendarTab() {
    return (
      <div>
        <PageHead title="Schedule" sub="Your sessions for the week. Click a session to reschedule or cancel."
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>← Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>This week</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>Next →</Button>
            </div>
          } />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((d) => {
            const isToday = d.toDateString() === new Date().toDateString();
            const dayB = bookings.filter((b) => new Date(b.scheduledAt).toDateString() === d.toDateString());
            return (
              <div key={isoDay(d)} className={`rounded-xl border p-3 ${isToday ? "border-royal bg-royal-soft" : "border-line bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-sub">{dayShort(d)}</span>
                  <span className={`font-display text-[15px] font-extrabold ${isToday ? "text-royal" : "text-ink"}`}>{d.getDate()}</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {dayB.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => (b.status === "upcoming" ? setResched(b) : undefined)}
                      className={`w-full cursor-pointer rounded-lg border-l-4 p-2 text-left ${b.status === "cancelled" ? "border-l-clay bg-clay-soft/50 opacity-70" : "border-l-royal bg-royal-soft"}`}
                    >
                      <div className="text-[11px] font-extrabold">{fmtTime(b.scheduledAt)}</div>
                      <div className="truncate text-[11.5px] font-bold text-ink/80">{b.student?.name}</div>
                      <div className="text-[10px] font-bold capitalize text-sub">{b.subject}{b.status === "cancelled" ? " · cancelled" : ""}</div>
                    </button>
                  ))}
                  {dayB.length === 0 && <div className="py-3 text-center text-[10.5px] font-bold text-sub/50">—</div>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[12.5px] font-semibold text-sub">Tip: click any upcoming session card to move it — students and parents are notified automatically.</p>
      </div>
    );
  }

  function SessionsTab() {
    return (
      <div>
        <PageHead title="Sessions & Availability" sub="Manage appointments and the hours parents can book you." />
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-[16px] font-bold">Upcoming appointments</h2>
            <div className="space-y-2.5">
              {upcoming.map((b) => (
                <Card key={b.id} className="flex items-center gap-3.5 p-4">
                  <Avatar name={b.student?.name ?? ""} size={38} hue={b.student?.hue} rounded="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold">{b.student?.name} · <span className="capitalize">{b.subject}</span></div>
                    <div className="text-[12px] font-semibold text-sub">{fmtDate(b.scheduledAt)} · {fmtTime(b.scheduledAt)} · {b.durationMin} min</div>
                  </div>
                  <button onClick={() => setResched(b)} className="cursor-pointer rounded-lg p-2 text-sub hover:bg-royal-soft hover:text-royal" aria-label="Reschedule"><RotateCcw size={14} /></button>
                  <button onClick={() => setCancelB(b)} className="cursor-pointer rounded-lg p-2 text-sub hover:bg-clay-soft hover:text-clay" aria-label="Cancel"><XCircle size={14} /></button>
                </Card>
              ))}
              {upcoming.length === 0 && <EmptyState icon={CalendarDays} title="Nothing scheduled" sub="New bookings will appear here." />}
            </div>
            <h2 className="mb-3 mt-7 font-display text-[16px] font-bold">Recent</h2>
            <div className="space-y-2">
              {past.slice(0, 4).map((b) => (
                <Card key={b.id} className="flex items-center gap-3.5 p-3.5">
                  <Check size={15} className={b.status === "cancelled" ? "text-clay" : "text-leaf"} />
                  <div className="flex-1 text-[13px] font-bold">{b.student?.name} · <span className="capitalize">{b.subject}</span></div>
                  <span className="text-[12px] font-semibold text-sub">{fmtDate(b.scheduledAt)}</span>
                </Card>
              ))}
            </div>
          </div>

          <Card className="h-fit p-6">
            <h2 className="font-display text-[16px] font-bold">Weekly availability</h2>
            <p className="mt-1 text-[12.5px] font-semibold text-sub">These hours show up in the booking calendar for your students.</p>
            <div className="mt-5 space-y-3">
              {avail.map((a) => (
                <div key={a.day} className={`flex items-center gap-3 rounded-xl border p-3.5 ${a.on ? "border-royal/30 bg-royal-soft/50" : "border-line bg-cream opacity-70"}`}>
                  <span className="w-10 text-[13px] font-extrabold">{a.day}</span>
                  <Toggle on={a.on} onChange={(v) => setAvail(avail.map((x) => (x.day === a.day ? { ...x, on: v } : x)))} />
                  {a.on ? (
                    <div className="ml-auto flex items-center gap-2 text-[12.5px] font-bold">
                      <Select value={a.start} onChange={(e) => setAvail(avail.map((x) => (x.day === a.day ? { ...x, start: Number(e.target.value) } : x)))} className="w-auto py-1.5 text-[12px]">
                        {[15, 16, 17].map((h) => <option key={h} value={h}>{h - 12}:00 PM</option>)}
                      </Select>
                      <span className="text-sub">–</span>
                      <Select value={a.end} onChange={(e) => setAvail(avail.map((x) => (x.day === a.day ? { ...x, end: Number(e.target.value) } : x)))} className="w-auto py-1.5 text-[12px]">
                        {[17, 18, 19, 20].map((h) => <option key={h} value={h}>{h - 12}:00 PM</option>)}
                      </Select>
                    </div>
                  ) : (
                    <span className="ml-auto text-[11.5px] font-bold text-sub">Closed</span>
                  )}
                </div>
              ))}
            </div>
            <Button variant="primary" className="mt-5 w-full" disabled={savingAvail} onClick={saveAvail}>
              <Save size={15} /> {savingAvail ? "Saving…" : "Save availability"}
            </Button>
          </Card>
        </div>

        <Modal open={!!resched} onClose={() => setResched(null)} title="Reschedule session"
          footer={<>
            <Button variant="outline" onClick={() => setResched(null)}>Cancel</Button>
            <Button onClick={doReschedule} disabled={!rDay || !rTime}>Confirm</Button>
          </>}>
          <div className="space-y-4">
            <p className="text-[13.5px] font-semibold text-sub">
              {resched?.student?.name} · <span className="capitalize">{resched?.subject}</span> — currently {resched ? fmtDateLong(resched.scheduledAt) : ""} at {resched ? fmtTime(resched.scheduledAt) : ""}.
            </p>
            <Field label="New date">
              <Select value={rDay} onChange={(e) => setRDay(e.target.value)}>
                <option value="">Choose a date</option>
                {Array.from({ length: 10 }, (_, i) => { const d = addDays(new Date(), i + 1); return <option key={i} value={isoDay(d)}>{fmtDateLong(d)}</option>; })}
              </Select>
            </Field>
            <Field label="New time">
              <Select value={rTime} onChange={(e) => setRTime(e.target.value)}>
                <option value="">Choose a time</option>
                {["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
        </Modal>

        <Modal open={!!cancelB} onClose={() => setCancelB(null)} title="Cancel session?"
          footer={<>
            <Button variant="outline" onClick={() => setCancelB(null)}>Keep it</Button>
            <Button variant="danger" onClick={doCancel}>Cancel session</Button>
          </>}>
          <p className="text-[14px] font-semibold text-sub">
            This notifies {cancelB?.student?.name}'s parent instantly and refunds the fee.
          </p>
        </Modal>
      </div>
    );
  }

  function ProfileTab() {
    return (
      <div>
        <PageHead title="My Profile" action={<Button href={`/tutors/${tutor?.slug}`} variant="outline" size="sm"><ExternalLink size={13} /> View public profile</Button>} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-7">
            <div className="flex items-center gap-5">
              <Avatar name={me.name} photo={tutor?.photo} size={84} rounded="rounded-2xl" />
              <div>
                <div className="font-display text-[20px] font-extrabold">{me.name}</div>
                <div className="text-[13.5px] font-semibold text-sub">{tutor?.title}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Stars value={tutor?.rating ?? 0} size={14} />
                  <span className="text-[13px] font-extrabold">{(tutor?.rating ?? 0).toFixed(1)}</span>
                  <span className="text-[12px] font-semibold text-sub">({tutor?.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-line bg-cream p-4 text-center">
                <div className="font-display text-[19px] font-extrabold">{tutor?.experienceYears}</div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-sub">Years exp</div>
              </div>
              <div className="rounded-xl border border-line bg-cream p-4 text-center">
                <div className="font-display text-[19px] font-extrabold">{myStudents.length}</div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-sub">Students</div>
              </div>
              <div className="rounded-xl border border-line bg-cream p-4 text-center">
                <div className="font-display text-[19px] font-extrabold">{bookings.length}</div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-sub">Sessions</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {tutor?.subjects.map((s) => <Badge key={s} tone="blue">{SUBJECT_MAP[s]?.name ?? s}</Badge>)}
              <Badge tone="outline"><GraduationCap size={11} className="mr-1" /> Grade {tutor?.gradeMin === 0 ? "K" : tutor?.gradeMin}–{tutor?.gradeMax}</Badge>
            </div>
          </Card>
          <Card className="p-7">
            <h2 className="font-display text-[16px] font-bold">Session rates</h2>
            <p className="mt-1 text-[12.5px] font-semibold text-sub">Applied to all new bookings immediately.</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Field label="30-minute">
                <Input type="number" value={rates.r30} onChange={(e) => setRates({ ...rates, r30: Number(e.target.value) })} />
              </Field>
              <Field label="60-minute">
                <Input type="number" value={rates.r60} onChange={(e) => setRates({ ...rates, r60: Number(e.target.value) })} />
              </Field>
            </div>
            <Button variant="primary" className="mt-5 w-full" onClick={saveRates}><Save size={14} /> Update rates</Button>
            <div className="mt-7 rounded-xl bg-cream p-4 text-[12.5px] font-semibold leading-relaxed text-sub">
              <Clock size={14} className="mb-1.5 text-royal" />
              Availability hours are managed in the Sessions tab. Students can only book slots that you leave open.
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
