"use client";

import { useEffect, useMemo, useState } from "react";
import { Header, Footer } from "@/components/site";
import { Card, Button, Badge, Avatar, SubjectIcon, Field, Select, Input, Textarea, cn } from "@/components/ui";
import { SUBJECTS, GRADES, LEVELS } from "@/lib/const";
import { api, useAuth, money, slotsFor, fmtDateLong, fmtTime, dayShort, isoDay, addDays } from "@/lib/client";
import type { TutorLite } from "@/components/cards";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  CreditCard,
  Lock,
  PartyPopper,
  Shield,
  Info,
  GraduationCap,
} from "lucide-react";

const STEPS = ["Student & Tutor", "Subject & Format", "Date & Time", "Review", "Payment"];

export default function BookPage() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<TutorLite[]>([]);
  const [students, setStudents] = useState<{ id: number; name: string; grade: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [step, setStep] = useState(0);
  const [studentId, setStudentId] = useState(0);
  const [tutorId, setTutorId] = useState(0);
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState<"1on1" | "group">("1on1");
  const [duration, setDuration] = useState(30);
  const [dateISO, setDateISO] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; total: number } | null>(null);

  // prefill from query
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get("subject");
    if (s && SUBJECTS.some((x) => x.slug === s)) setSubject(s);
    const st = p.get("student");
    if (st) setStudentId(Number(st));
    Promise.all([api("/api/tutors"), api("/api/students")]).then(([t, s2]) => {
      const tutors: TutorLite[] = t;
      const kids: { id: number; name: string; grade: number }[] = s2;
      setTutors(tutors);
      setStudents(kids);
      const tutorSlug = p.get("tutor");
      if (tutorSlug) {
        const found = tutors.find((x) => x.slug === tutorSlug);
        if (found) setTutorId(found.id);
      }
      if (user?.role === "student") setStudentId(user.id);
      else if (user?.role === "parent") setStudentId(s2[0]?.id ?? 0);
      else if (s2.length) setStudentId(s2[0].id);
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tutor = tutors.find((t) => t.id === tutorId);
  const student = students.find((s) => s.id === studentId);
  const price = !tutor ? 0 : kind === "group" ? Math.round(tutor.rate30 * 0.85) : duration === 30 ? tutor.rate30 : tutor.rate60;

  const days = useMemo(() => {
    const out: { d: Date; iso: string; slots: { time: string; disabled: boolean }[] }[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = addDays(today, i);
      const slots = tutor ? slotsFor(tutor.id, tutor.days, d) : [];
      out.push({ d, iso: isoDay(d), slots });
    }
    return out;
  }, [tutor]);

  const canNext =
    (step === 0 && studentId > 0 && tutorId > 0) ||
    (step === 1 && subject) ||
    (step === 2 && dateISO && time) ||
    (step === 3 && contact.includes("@"));

  const selectDay = (iso: string) => {
    setDateISO(iso);
    setTime("");
  };

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const when = new Date(`${dateISO}T${timeTo24(time)}:00`).toISOString();
      const booking = await api("/api/bookings", {
        body: {
          studentId,
          tutorId,
          subject,
          kind,
          durationMin: kind === "group" ? 45 : duration,
          scheduledAt: when,
          price,
          notes,
        },
      });
      await api("/api/payments", {
        body: {
          studentId,
          label: `${kind === "group" ? "Group" : "1-on-1"} ${subject} session — ${tutor?.name}`,
          type: "session",
          amount: price,
        },
      });
      setDone({ ref: booking.ref, total: price });
      setStep(5);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (!loaded)
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="wrap py-32 text-center text-sm font-bold text-sub">Preparing booking…</div>
        <Footer />
      </div>
    );

  const fmtCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <div className="wrap max-w-[1000px] py-10">
        {step < 5 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-royal">Book a Session</div>
                <h1 className="mt-1 font-display text-[30px] font-extrabold tracking-tight">
                  {STEPS[step]}
                </h1>
              </div>
              {student && (
                <div className="hidden items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 sm:flex">
                  <Avatar name={student.name} size={30} hue={210} rounded="rounded-full" />
                  <span className="text-[12.5px] font-bold">{student.name}</span>
                  <Badge tone="outline">{student.grade === 0 ? "K" : `G${student.grade}`}</Badge>
                </div>
              )}
            </div>

            {/* stepper */}
            <div className="mt-6 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-1.5">
                  <div className={cn("h-1.5 rounded-full transition-colors duration-500", i <= step ? "bg-royal" : "bg-ink/10")} />
                  <span className={cn("hidden text-[10.5px] font-extrabold uppercase tracking-wider sm:block", i <= step ? "text-royal-deep" : "text-sub/60")}>
                    {i + 1}. {s}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8">
          {/* STEP 0: student & tutor */}
          {step === 0 && (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="flex items-center gap-2 font-display text-[17px] font-bold">
                  <User size={17} className="text-royal" /> Who are we booking for?
                </h2>
                <div className="mt-4 space-y-2.5">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStudentId(s.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3.5 rounded-xl border-2 p-3.5 text-left transition-all",
                        studentId === s.id ? "border-royal bg-royal-soft" : "border-line bg-white hover:border-royal/40"
                      )}
                    >
                      <Avatar name={s.name} size={42} hue={200 + s.id * 30} rounded="rounded-full" />
                      <div className="flex-1">
                        <div className="text-[14.5px] font-bold">{s.name}</div>
                        <div className="text-[12px] font-semibold text-sub">
                          {s.grade === 0 ? "Kindergarten" : `Grade ${s.grade}`}
                        </div>
                      </div>
                      {studentId === s.id && <span className="grid h-6 w-6 place-items-center rounded-full bg-royal text-white"><Check size={13} /></span>}
                    </button>
                  ))}
                </div>
                <p className="mt-4 flex items-start gap-2 text-[12px] font-semibold text-sub">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  Parents can add more children anytime from their dashboard.
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="flex items-center gap-2 font-display text-[17px] font-bold">
                  <GraduationCap size={17} className="text-royal" /> Choose your tutor
                </h2>
                <div className="mt-4 max-h-[430px] space-y-2.5 overflow-y-auto pr-1">
                  {tutors.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTutorId(t.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3.5 rounded-xl border-2 p-3 text-left transition-all",
                        tutorId === t.id ? "border-royal bg-royal-soft" : "border-line bg-white hover:border-royal/40"
                      )}
                    >
                      <Avatar name={t.name} photo={t.photo} size={42} rounded="rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-bold">{t.name}</div>
                        <div className="truncate text-[11.5px] font-semibold text-sub">
                          {t.subjects.map((s) => s[0].toUpperCase() + s.slice(1)).join(" · ")} · {t.rating.toFixed(1)}★
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-extrabold">{money(t.rate30)}</div>
                        <div className="text-[10.5px] font-bold text-sub">/30 min</div>
                      </div>
                      {tutorId === t.id && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal text-white"><Check size={13} /></span>}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* STEP 1: subject & format */}
          {step === 1 && tutor && (
            <Card className="p-6">
              <h2 className="font-display text-[17px] font-bold">What should you work on?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {SUBJECTS.filter((s) => tutor.subjects.includes(s.slug)).map((s) => (
                  <button
                    key={s.slug}
                    onClick={() => setSubject(s.slug)}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
                      subject === s.slug ? "border-royal bg-royal-soft" : "border-line bg-white hover:border-royal/40"
                    )}
                  >
                    <SubjectIcon slug={s.slug} withBg size={20} className="mx-auto" />
                    <div className="mt-2.5 text-[13px] font-bold">{s.name}</div>
                    <div className="mt-0.5 text-[10.5px] font-semibold text-sub">{s.grades}</div>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="label">Session format</div>
                  <div className="grid grid-cols-2 gap-3">
                    {(["1on1", "group"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setKind(k)}
                        className={cn(
                          "cursor-pointer rounded-xl border-2 p-4 text-left transition-all",
                          kind === k ? "border-royal bg-royal-soft" : "border-line bg-white hover:border-royal/40"
                        )}
                      >
                        <div className="text-[13.5px] font-extrabold">{k === "1on1" ? "1-on-1 Private" : "Group Session"}</div>
                        <div className="mt-1 text-[11.5px] font-semibold leading-relaxed text-sub">
                          {k === "1on1"
                            ? "Full attention from your tutor"
                            : "Small group · 45 min · 15% off"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label">Duration</div>
                  <div className="grid grid-cols-2 gap-3">
                    {kind === "1on1" ? (
                      [30, 60].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
                            duration === d ? "border-royal bg-royal-soft" : "border-line bg-white hover:border-royal/40"
                          )}
                        >
                          <div className="font-display text-[18px] font-extrabold">{d} min</div>
                          <div className="mt-1 text-[12px] font-bold text-sub">{d === 30 ? money(tutor.rate30) : money(tutor.rate60)}</div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-xl border-2 border-royal bg-royal-soft p-4 text-center">
                        <div className="font-display text-[18px] font-extrabold">45 min</div>
                        <div className="mt-1 text-[12px] font-bold text-royal-deep">
                          {money(Math.round(tutor.rate30 * 0.85))} per seat
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 rounded-xl bg-cream p-4 text-[12.5px] font-semibold text-sub">
                    Teaching with <strong className="text-ink">{tutor.name}</strong> — {tutor.title}, {tutor.experienceYears} years of experience.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: date & time */}
          {step === 2 && tutor && (
            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-display text-[17px] font-bold">
                <CalendarDays size={17} className="text-royal" /> Pick a date
              </h2>
              <p className="mt-1 text-[12.5px] font-semibold text-sub">
                {tutor.name} is available {tutor.days.join(", ")} · 3:00 – 8:00 PM
              </p>
              <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2">
                {days.map(({ d, iso, slots }) => {
                  const open = slots.filter((s) => !s.disabled).length;
                  const closed = slots.length === 0;
                  return (
                    <button
                      key={iso}
                      disabled={closed}
                      onClick={() => selectDay(iso)}
                      className={cn(
                        "flex min-w-[76px] cursor-pointer flex-col items-center rounded-xl border-2 px-3 py-3 transition-all",
                        closed
                          ? "cursor-not-allowed border-line/60 bg-cream opacity-50"
                          : dateISO === iso
                            ? "border-royal bg-royal text-white"
                            : "border-line bg-white hover:border-royal/50"
                      )}
                    >
                      <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">{dayShort(d)}</span>
                      <span className="font-display text-[20px] font-extrabold leading-tight">{d.getDate()}</span>
                      <span className={cn("text-[10.5px] font-bold", dateISO === iso ? "text-white/80" : open <= 3 ? "text-clay" : "text-leaf")}>
                        {closed ? "—" : `${open} slots`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {dateISO ? (
                <>
                  <h3 className="mt-7 flex items-center gap-2 font-display text-[16px] font-bold">
                    <Clock size={16} className="text-royal" />
                    {fmtDateLong(dateISO)}
                  </h3>
                  <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {days.find((x) => x.iso === dateISO)?.slots.map((s) => (
                      <button
                        key={s.time}
                        disabled={s.disabled}
                        onClick={() => setTime(s.time)}
                        className={cn(
                          "rounded-[10px] border-2 py-2.5 text-[13px] font-bold transition-all",
                          s.disabled
                            ? "cursor-not-allowed border-line/60 bg-cream text-sub/40 line-through"
                            : time === s.time
                              ? "border-royal bg-royal text-white"
                              : "border-line bg-white hover:border-royal/50"
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-7 rounded-xl border border-dashed border-line bg-white px-5 py-4 text-[13px] font-semibold text-sub">
                  Select a day to see open time slots.
                </p>
              )}
            </Card>
          )}

          {/* STEP 3: review */}
          {step === 3 && tutor && student && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="p-6">
                <h2 className="font-display text-[17px] font-bold">Review your session</h2>
                <dl className="mt-5 divide-y divide-line">
                  {[
                    ["Student", `${student.name} · ${student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`}`],
                    ["Tutor", `${tutor.name} — ${tutor.title}`],
                    ["Subject", SUBJECTS.find((s) => s.slug === subject)?.name ?? subject],
                    ["Format", kind === "group" ? "Group session (45 min)" : `1-on-1 · ${duration} min`],
                    ["When", `${fmtDateLong(dateISO)} · ${time}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-3.5">
                      <dt className="text-[12px] font-extrabold uppercase tracking-wider text-sub">{k}</dt>
                      <dd className="text-[14px] font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 grid gap-4">
                  <Field label="Parent / guardian email" hint="Session reminders and tutor notes are sent here.">
                    <Input
                      type="email"
                      placeholder="parent@example.com"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </Field>
                  <Field label="Anything your tutor should know? (optional)">
                    <Textarea rows={3} placeholder="e.g. Emma struggles with word problems, upcoming test on Friday…" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </Field>
                </div>
              </Card>

              <Card className="h-fit p-6">
                <h3 className="font-display text-[16px] font-bold">Order summary</h3>
                <div className="mt-4 space-y-2.5 text-[13.5px]">
                  <div className="flex justify-between"><span className="text-sub">{kind === "group" ? "Group" : `1-on-1 ${duration}-min`} {subject} session</span><span className="font-bold">{money(price)}</span></div>
                  <div className="flex justify-between"><span className="text-sub">Platform fee</span><span className="font-bold text-leaf">$0</span></div>
                  <div className="flex justify-between border-t border-line pt-2.5 text-[15px] font-extrabold"><span>Total due today</span><span>{money(price)}</span></div>
                </div>
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-leaf-soft p-3.5 text-[12px] font-semibold text-leaf">
                  <Shield size={15} className="mt-0.5 shrink-0" />
                  Free rescheduling up to 12 hours before the session. Full refund if the tutor cancels.
                </div>
              </Card>
            </div>
          )}

          {/* STEP 4: payment */}
          {step === 4 && tutor && student && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="p-6">
                <h2 className="flex items-center gap-2 font-display text-[17px] font-bold">
                  <CreditCard size={17} className="text-royal" /> Secure payment
                </h2>
                <div className="mt-5 grid gap-4">
                  <Field label="Name on card">
                    <Input placeholder="Jane Rivera" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  </Field>
                  <Field label="Card number">
                    <Input inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry">
                      <Input inputMode="numeric" placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} />
                    </Field>
                    <Field label="CVC">
                      <Input inputMode="numeric" placeholder="123" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })} />
                    </Field>
                  </div>
                  {error && <div className="rounded-lg bg-clay-soft px-4 py-3 text-[13px] font-bold text-clay">{error}</div>}
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full"
                    disabled={paying || !card.name || card.number.replace(/\s/g, "").length < 15 || card.exp.length < 5 || card.cvc.length < 3}
                    onClick={pay}
                  >
                    <Lock size={16} />
                    {paying ? "Processing securely…" : `Pay ${money(price)} & confirm`}
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-sub">
                    <Lock size={12} /> 256-bit encrypted checkout · Demo mode — no real charge is made
                  </p>
                </div>
              </Card>

              <Card className="h-fit bg-navy p-6 text-white">
                <h3 className="font-display text-[16px] font-bold">Order summary</h3>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Student</div>
                    <div className="mt-0.5 font-bold">{student.name}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">Session</div>
                    <div className="mt-0.5 font-bold capitalize">{subject} · {kind === "group" ? "Group 45 min" : `1-on-1 ${duration} min`}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">When</div>
                    <div className="mt-0.5 font-bold">{fmtDateLong(dateISO)} · {time}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-white/50">With</div>
                    <div className="mt-0.5 font-bold">{tutor.name}</div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                  <span className="text-[13px] font-bold text-white/70">Total</span>
                  <span className="font-display text-[24px] font-extrabold text-amber">{money(price)}</span>
                </div>
              </Card>
            </div>
          )}

          {/* footer nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft size={16} /> Back
            </Button>
            {step < 4 && (
              <Button variant="primary" size="lg" disabled={!canNext} onClick={() => { setStep((s) => s + 1); setError(""); }}>
                Continue <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* SUCCESS */}
        {step === 5 && done && tutor && student && (
          <div className="mx-auto max-w-xl">
            <Card className="overflow-hidden">
              <div className="relative bg-navy px-8 py-12 text-center text-white">
                <div className="bg-dots-dark absolute inset-0 opacity-40" />
                <div className="relative">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber text-white">
                    <PartyPopper size={28} />
                  </span>
                  <h1 className="mt-5 font-display text-[30px] font-extrabold">Session confirmed!</h1>
                  <p className="mt-2 text-[14px] text-white/70">
                    Confirmation <strong className="text-amber">{done.ref}</strong> · A receipt was
                    added to your payment history.
                  </p>
                </div>
              </div>
              <div className="p-7">
                <div className="flex items-center gap-4 rounded-xl border border-line bg-cream p-4">
                  <Avatar name={tutor.name} photo={tutor.photo} size={52} rounded="rounded-full" />
                  <div className="flex-1">
                    <div className="font-display text-[16px] font-bold">{tutor.name}</div>
                    <div className="text-[12.5px] font-semibold text-sub">
                      {SUBJECTS.find((s) => s.slug === subject)?.name} · {kind === "group" ? "Group" : `1-on-1 ${duration} min`}
                    </div>
                  </div>
                  <Badge tone="blue">{money(done.total)}</Badge>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line p-4">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-sub">Date & time</div>
                    <div className="mt-1 text-[14px] font-bold">{fmtDateLong(dateISO)}</div>
                    <div className="text-[13px] font-semibold text-sub">{time}</div>
                  </div>
                  <div className="rounded-xl border border-line p-4">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-sub">Student</div>
                    <div className="mt-1 text-[14px] font-bold">{student.name}</div>
                    <div className="text-[13px] font-semibold text-sub">{student.grade === 0 ? "Kindergarten" : `Grade ${student.grade}`}</div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button variant="primary" href={user?.role === "tutor" ? "/portal/tutor" : user?.role === "student" ? "/portal/student" : "/portal/parent"}>
                    Go to my dashboard
                  </Button>
                  <Button variant="outline" href="/">Back to home</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function timeTo24(t: string) {
  const [hm, ap] = t.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
