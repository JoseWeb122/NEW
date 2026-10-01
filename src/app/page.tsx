import { db } from "@/db";
import { tutors, groupClasses, lessons } from "@/db/schema";
import { Header, Footer } from "@/components/site";
import {
  Reveal,
  SectionHead,
  Button,
  Badge,
  Card,
  Counter,
  ProgressBar,
  SubjectIcon,
} from "@/components/ui";
import { TutorCard, ClassCard, LessonCard, TestimonialCard } from "@/components/cards";
import {
  SUBJECTS,
  LEVELS,
  HOW_STEPS,
  TRUST_POINTS,
  TESTIMONIALS,
  MEDIA,
} from "@/lib/const";
import {
  ArrowRight,
  Video,
  Users,
  PlayCircle,
  Shield,
  Award,
  Target,
  CalendarDays,
  Layers,
  Eye,
  GraduationCap,
  Sparkles,
  Check,
  Star,
  Flame,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const trustIcons: Record<string, typeof Award> = {
  award: Award,
  grad: GraduationCap,
  target: Target,
  calendar: CalendarDays,
  layers: Layers,
  eye: Eye,
};

export default async function Home() {
  const [tutRows, clsRows, lesRows] = await Promise.all([
    db.select().from(tutors),
    db.select().from(groupClasses),
    db.select().from(lessons),
  ]);
  const tutorsMapped = tutRows.map((t) => ({ ...t, rating: Number(t.rating) }));
  const tMap = new Map(tutRows.map((t) => [t.id, t]));
  const classes = clsRows
    .map((c) => ({
      ...c,
      tutor: tMap.get(c.tutorId)
        ? { name: tMap.get(c.tutorId)!.name, photo: tMap.get(c.tutorId)!.photo }
        : null,
    }))
    .sort((a, b) => a.enrolled - b.enrolled)
    .slice(0, 3);
  const featuredLessons = [...lesRows]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4);
  const featuredTutors = [...tutorsMapped].sort((a, b) => b.rating - a.rating).slice(0, 3);

  const countsFor = (slug: string) => ({
    tutors: tutRows.filter((t) => t.subjects.includes(slug)).length,
    lessons: lesRows.filter((l) => l.subject === slug).length,
    classes: clsRows.filter((c) => c.subject === slug).length,
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(80%_70%_at_50%_20%,black,transparent)]" />
        <div className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-royal/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-amber/10 blur-3xl" />

        <div className="wrap relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-royal/25 bg-royal-soft px-4 py-1.5 text-[12px] font-bold text-royal-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-amber anim-pulse-dot" />
                K–12 Online Tutoring · Live, Group & Recorded
              </div>
            </Reveal>
            <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[1.06] tracking-tight sm:text-[54px]">
              <span className="mask-line"><span style={{ ["--d" as string]: "0.05s" }}>Helping K–12</span></span>
              <span className="mask-line"><span style={{ ["--d" as string]: "0.18s" }}>students learn</span></span>
              <span className="mask-line"><span style={{ ["--d" as string]: "0.31s" }}>
                with <span className="relative text-royal">confidence
                  <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 220 10" fill="none" preserveAspectRatio="none">
                    <path d="M2 7C60 2 160 2 218 6" stroke="#E8962E" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </span></span>
            </h1>
            <Reveal delay={150}>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-sub">
                Personalized tutoring across reading, math, spelling, science, and English.
                Qualified tutors, engaging lessons, and academic support that meets your child
                exactly where they are — kindergarten through grade 12.
              </p>
            </Reveal>
            <Reveal delay={250}>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Button href="/book" variant="accent" size="lg">
                  Get Started <ArrowRight size={17} />
                </Button>
                <Button href="/tutors" variant="outline" size="lg">
                  Explore Tutoring
                </Button>
              </div>
            </Reveal>
            <Reveal delay={350}>
              <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  { v: 5, s: "", l: "Core subjects" },
                  { v: 15, s: "", l: "Grade levels" },
                  { v: 3, s: "", l: "Learning formats" },
                  { v: 24, s: "/7", l: "Session support" },
                ].map((x) => (
                  <div key={x.l}>
                    <div className="font-display text-[26px] font-extrabold text-ink">
                      <Counter to={x.v} suffix={x.s} />
                    </div>
                    <div className="text-[11.5px] font-bold uppercase tracking-wider text-sub">{x.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* hero visual */}
          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="relative overflow-hidden rounded-[20px] border-4 border-white shadow-[0_30px_70px_-24px_rgb(19_28_46/0.45)]">
              <img
                src={MEDIA.hero}
                alt="Tutor guiding a student through a virtual lesson"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/45 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/95 p-3 backdrop-blur">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-royal-soft text-royal"><Video size={18} /></span>
                <div className="flex-1">
                  <div className="text-[12.5px] font-extrabold">Live 1-on-1 session in progress</div>
                  <div className="text-[11.5px] font-semibold text-sub">Math · Fractions & Decimals · Grade 5</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-soft px-2.5 py-1 text-[10.5px] font-extrabold text-clay">
                  <span className="h-1.5 w-1.5 rounded-full bg-clay anim-rec" /> LIVE
                </span>
              </div>
            </div>

            {/* floating card: next session */}
            <Card className="anim-float absolute -left-6 -top-6 hidden w-[210px] p-4 sm:block">
              <div className="flex items-center gap-2 text-[10.5px] font-extrabold uppercase tracking-wider text-sub">
                <span className="h-1.5 w-1.5 rounded-full bg-amber anim-pulse-dot" /> Next session
              </div>
              <div className="mt-2 font-display text-[14px] font-bold leading-tight">Math with Sarah J.</div>
              <div className="mt-1 text-[12px] font-semibold text-sub">Today · 4:00 PM · 30 min</div>
              <div className="mt-3 rounded-lg bg-royal py-2 text-center text-[12px] font-extrabold text-white">
                Join Session
              </div>
            </Card>

            {/* floating card: progress */}
            <Card className="anim-float-2 absolute -bottom-8 -right-4 hidden w-[230px] p-4 sm:block">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sub">Weekly progress</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-[10.5px] font-extrabold text-amber-deep">
                  <Flame size={11} /> 5-day streak
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {[
                  { l: "Reading", v: 78, c: "#B4552D" },
                  { l: "Math", v: 84, c: "#2B50C8" },
                  { l: "Science", v: 72, c: "#1E7A55" },
                ].map((x) => (
                  <div key={x.l} className="flex items-center gap-2.5">
                    <span className="w-14 text-[11.5px] font-bold text-sub">{x.l}</span>
                    <ProgressBar value={x.v} color={x.c} size="sm" className="flex-1" />
                    <span className="text-[11.5px] font-extrabold">{x.v}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============ PROGRAMS ============ */}
      <section id="programs" className="border-y border-line bg-cream py-20 scroll-mt-24">
        <div className="wrap">
          <SectionHead
            eyebrow="Our Programs"
            title="Three ways to learn. One academic standard."
            sub="Every program — live, group, or recorded — is taught by the same qualified tutors and tracked in the same progress system."
            center
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Video,
                title: "Live 1-on-1 Tutoring",
                desc: "A private session with a dedicated tutor. Real-time instruction, screen sharing, chat, and session notes shared with parents.",
                points: ["Dedicated tutor & schedule", "Session notes & feedback", "Homework & exam support"],
                cta: { label: "Book a session", href: "/book" },
                accent: "#2B50C8",
              },
              {
                icon: Users,
                title: "Group Classes",
                desc: "Small, structured classes of up to 8 students at the same grade level — collaborative, competitive, and fun.",
                points: ["Classes of 6–8 students", "Weekly recurring schedule", "Grade-matched groups"],
                cta: { label: "Browse classes", href: "/classes" },
                accent: "#E8962E",
              },
              {
                icon: PlayCircle,
                title: "Recorded Lessons",
                desc: "A professional library of recorded lessons to watch on demand — perfect for review, catch-up, and enrichment.",
                points: ["Watch anytime, anywhere", "Progress tracked per lesson", "New lessons every week"],
                cta: { label: "Open the library", href: "/lessons" },
                accent: "#1E7A55",
              },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <Card lift className="flex h-full flex-col p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-xl text-white" style={{ background: p.accent }}>
                    <p.icon size={22} />
                  </span>
                  <h3 className="mt-5 font-display text-[19px] font-bold">{p.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-sub">{p.desc}</p>
                  <ul className="mt-5 space-y-2.5">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-ink/80">
                        <span className="mt-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-leaf-soft text-leaf">
                          <Check size={11} />
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.cta.href}
                    className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[14px] font-extrabold text-royal hover:gap-2.5 transition-all"
                  >
                    {p.cta.label} <ArrowRight size={15} />
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GRADE LEVELS ============ */}
      <section id="levels" className="py-20 scroll-mt-24">
        <div className="wrap">
          <SectionHead
            eyebrow="Grade & Age Structure"
            title="Pick the right level for your child"
            sub="From kindergarten foundations to senior-year coursework — every program is organized by grade band and subject."
            action={<Button href="/tutors" variant="outline">Browse all tutors</Button>}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {LEVELS.map((lvl, i) => {
              const grades = lvl.gradeRange;
              return (
                <Reveal key={lvl.id} delay={i * 100}>
                  <Card lift className="flex h-full flex-col p-7">
                    <div className="flex items-center justify-between">
                      <Badge tone={i === 0 ? "amber" : i === 1 ? "blue" : "green"}>{lvl.range}</Badge>
                      <span className="font-display text-[30px] font-extrabold text-ink/10">{i + 1}</span>
                    </div>
                    <h3 className="mt-4 font-display text-[20px] font-bold">{lvl.name}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-sub">{lvl.description}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {Array.from({ length: grades[1] - grades[0] + 1 }, (_, k) => grades[0] + k).map((g) => (
                        <Link
                          key={g}
                          href={`/tutors?grade=${g}`}
                          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-bold text-sub transition-colors hover:border-royal hover:bg-royal hover:text-white"
                        >
                          {g === 0 ? "K" : g}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
                      <Link href={`/tutors?level=${lvl.id}`} className="rounded-[10px] border border-line bg-white py-2.5 text-center text-[12.5px] font-bold hover:border-royal hover:text-royal transition-colors">
                        Tutors
                      </Link>
                      <Link href={`/lessons?level=${lvl.id}`} className="rounded-[10px] bg-navy py-2.5 text-center text-[12.5px] font-bold text-white hover:bg-navy-2 transition-colors">
                        Lessons
                      </Link>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SUBJECTS ============ */}
      <section id="subjects" className="border-y border-line bg-cream py-20 scroll-mt-24">
        <div className="wrap">
          <SectionHead
            eyebrow="Subjects"
            title="Five core subjects, taught in depth"
            sub="Every tutor specializes in defined grade bands, so instruction always matches your child's curriculum."
            action={<Button href="/subjects" variant="outline">Subject directory</Button>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {SUBJECTS.map((s, i) => {
              const c = countsFor(s.slug);
              return (
                <Reveal key={s.slug} delay={i * 80}>
                  <Link href={`/subjects#${s.slug}`} className="block h-full">
                    <Card lift className="group flex h-full flex-col p-5">
                      <SubjectIcon slug={s.slug} withBg size={24} />
                      <h3 className="mt-4 font-display text-[17px] font-bold">{s.name}</h3>
                      <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-sub">{s.short}.</p>
                      <div className="mt-4 space-y-1.5 text-[12px] font-bold text-sub">
                        <div className="flex justify-between"><span>Tutors</span><span className="text-ink">{c.tutors}</span></div>
                        <div className="flex justify-between"><span>Lessons</span><span className="text-ink">{c.lessons}</span></div>
                        <div className="flex justify-between"><span>Classes</span><span className="text-ink">{c.classes}</span></div>
                      </div>
                      <div className="mt-auto flex items-center gap-1 pt-4 text-[12.5px] font-extrabold" style={{ color: s.color }}>
                        Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="py-20 scroll-mt-24">
        <div className="wrap">
          <SectionHead
            eyebrow="How It Works"
            title="From first session to visible progress"
            sub="A clear, four-step path for parents, students, and tutors."
            center
          />
          <div className="relative grid gap-6 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-gradient-to-r from-transparent via-royal/30 to-transparent md:block" />
            {HOW_STEPS.map((st, i) => (
              <Reveal key={st.n} delay={i * 110}>
                <div className="relative">
                  <span className="relative z-10 inline-flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-line bg-white font-display text-[22px] font-extrabold text-royal shadow-[0_10px_24px_-12px_rgb(19_28_46/0.25)]">
                    {st.n}
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-amber text-[11px] font-extrabold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-5 font-display text-[16.5px] font-bold">{st.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-sub">{st.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TUTOR PREVIEW ============ */}
      <section className="border-y border-line bg-cream py-20">
        <div className="wrap">
          <SectionHead
            eyebrow="Find a Tutor"
            title="Meet our teaching team"
            sub="Qualified, grade-specific tutors with structured approaches and measurable outcomes."
            action={<Button href="/tutors" variant="outline">View all tutors <ArrowRight size={15} /></Button>}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {featuredTutors.map((t, i) => (
              <TutorCard key={t.id} tutor={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ LIVE 1-ON-1 ============ */}
      <section className="py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-[0_30px_70px_-24px_rgb(19_28_46/0.4)]">
                <img src={MEDIA.live} alt="Student in a live tutoring session" className="aspect-[4/3] w-full object-cover" />
              </div>
              <Card className="absolute -bottom-6 left-6 flex items-center gap-3 p-3.5 pr-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-amber"><BookOpen size={18} /></span>
                <div>
                  <div className="text-[12.5px] font-extrabold">Session materials shared</div>
                  <div className="text-[11.5px] font-semibold text-sub">fractions_worksheet.pdf · 2 MB</div>
                </div>
              </Card>
            </div>
          </Reveal>
          <div>
            <SectionHead
              eyebrow="Live 1-on-1 Tutoring"
              title="A real classroom, without the commute"
              sub="Our live session room keeps students focused: video, shared materials, chat, and a lesson timer — nothing to distract them from learning."
            />
            <ul className="space-y-4">
              {[
                { t: "Video, screen sharing & audio", d: "Tutors walk through problems step by step on a shared screen." },
                { t: "Built-in chat & file sharing", d: "Worksheets, study guides, and practice sets live in every session." },
                { t: "Post-session notes & feedback", d: "Every session ends with documented focus areas and recommended practice." },
                { t: "Flexible rescheduling", d: "Life happens. Move any session with one click — no penalty." },
              ].map((f) => (
                <li key={f.t} className="flex gap-3.5">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal-soft text-royal"><Check size={13} /></span>
                  <div>
                    <div className="text-[14.5px] font-bold">{f.t}</div>
                    <div className="text-[13.5px] text-sub">{f.d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/book" variant="primary">Book a live session</Button>
              <Button href="/live" variant="ghost" className="border border-line bg-white">See the session room</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GROUP CLASSES ============ */}
      <section className="border-y border-line bg-cream py-20">
        <div className="wrap">
          <SectionHead
            eyebrow="Group Classes"
            title="Learn together, stay on track"
            sub="Weekly grade-matched classes with open seats for the spring term."
            action={<Button href="/classes" variant="outline">All classes <ArrowRight size={15} /></Button>}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {classes.map((c, i) => (
              <ClassCard key={c.id} cls={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ RECORDED LESSONS ============ */}
      <section className="py-20">
        <div className="wrap">
          <SectionHead
            eyebrow="Recorded Lesson Library"
            title="On-demand lessons for every level"
            sub="Professional recordings organized by subject, grade, and topic — with progress tracked automatically."
            action={<Button href="/lessons" variant="outline">Open the library <ArrowRight size={15} /></Button>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredLessons.map((l, i) => (
              <LessonCard key={l.id} lesson={l} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARENT VISIBILITY ============ */}
      <section className="border-y border-line bg-cream py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SectionHead
              eyebrow="Parent Visibility"
              title="See exactly how learning is progressing"
              sub="The parent dashboard brings sessions, attendance, completed lessons, tutor feedback, and payments into a single, calm view — with a simple switcher for multiple children."
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              {[
                "Upcoming & completed sessions",
                "Attendance and session notes",
                "Progress by subject & skill",
                "Payments, invoices & receipts",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[13.5px] font-bold">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf-soft text-leaf"><Check size={12} /></span>
                  {t}
                </div>
              ))}
            </div>
            <Button href="/login" variant="dark" className="mt-8">Open the demo parent dashboard</Button>
          </div>
          <Reveal className="order-1 lg:order-2">
            <div className="relative">
              <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-[0_30px_70px_-24px_rgb(19_28_46/0.4)]">
                <img src={MEDIA.parent} alt="Parent reviewing progress with child" className="aspect-[4/3] w-full object-cover" />
              </div>
              <Card className="anim-float absolute -right-4 -top-6 w-[200px] p-4">
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-sub">Tutor feedback</div>
                <p className="mt-2 text-[12.5px] font-semibold leading-relaxed text-ink/85">
                  “Emma is improving quickly with equivalent fractions — keep up the daily practice.”
                </p>
                <div className="mt-2.5 text-[11.5px] font-extrabold text-royal">— Sarah J.</div>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ TRUST ============ */}
      <section className="py-20">
        <div className="wrap">
          <SectionHead
            eyebrow="Why Families Choose Us"
            title="Built on trust, structure, and measurable growth"
            center
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((t, i) => {
              const Icon = trustIcons[t.icon] ?? Shield;
              return (
                <Reveal key={t.title} delay={(i % 3) * 90}>
                  <Card className="flex h-full gap-4 p-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-royal-soft text-royal">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-[15.5px] font-bold">{t.title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-sub">{t.desc}</p>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-16">
            <Reveal>
              <div className="mb-8 flex items-center justify-center gap-2">
                <Star size={15} className="fill-amber text-amber" />
                <span className="text-[12.5px] font-extrabold uppercase tracking-[0.14em] text-sub">
                  What families say
                </span>
                <Star size={15} className="fill-amber text-amber" />
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.name} {...t} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="pb-24">
        <div className="wrap">
          <Reveal>
            <div className="relative overflow-hidden rounded-[24px] bg-navy px-8 py-14 text-center sm:px-16">
              <div className="bg-dots-dark absolute inset-0 opacity-50" />
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-royal/30 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
              <div className="relative">
                <Sparkles size={22} className="mx-auto text-amber" />
                <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-[40px]">
                  Start your child's journey to confident learning
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
                  Choose a grade, pick a subject, and find the right tutor — your first session
                  can happen this week.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                  <Button href="/book" variant="accent" size="lg">Get Started <ArrowRight size={17} /></Button>
                  <Button href="/tutors" variant="light" size="lg">Explore Tutoring</Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
