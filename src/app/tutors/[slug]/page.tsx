import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tutors, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Header, Footer } from "@/components/site";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Stars,
  SubjectIcon,
  Reveal,
  Ring,
} from "@/components/ui";
import { SUBJECT_MAP, DAYS, gradeShort } from "@/lib/const";
import { money, fmtGrade } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Users,
  Award,
  MessageSquareQuote,
  CalendarDays,
  Shield,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TutorProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tutor] = await db.select().from(tutors).where(eq(tutors.slug, slug));
  if (!tutor) notFound();
  const revs = await db.select().from(reviews).where(eq(reviews.tutorId, tutor.id));
  const rating = Number(tutor.rating);

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <div className="wrap py-10">
        <Link href="/tutors" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-sub hover:text-ink">
          <ArrowLeft size={14} /> All tutors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* main column */}
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-royal via-royal-deep to-navy" />
              <div className="flex flex-col gap-6 p-7 md:flex-row">
                <div className="shrink-0">
                  <Avatar name={tutor.name} photo={tutor.photo} size={132} rounded="rounded-2xl" />
                  <div className="mt-3 flex justify-center gap-1.5">
                    {tutor.formats.includes("1on1") && <Badge tone="blue">1-on-1</Badge>}
                    {tutor.formats.includes("group") && <Badge tone="amber">Group</Badge>}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="font-display text-[30px] font-extrabold tracking-tight">{tutor.name}</h1>
                      <p className="mt-1 text-[15px] font-semibold text-sub">{tutor.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Stars value={rating} size={15} />
                        <span className="text-[14px] font-extrabold">{rating.toFixed(1)}</span>
                        <span className="text-[13px] font-semibold text-sub">({tutor.reviewCount} reviews)</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-royal-soft px-5 py-3 text-center">
                      <div className="font-display text-[22px] font-extrabold text-royal-deep">{money(tutor.rate60)}</div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-royal-deep/70">per 60-min session</div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { icon: Award, l: "Experience", v: `${tutor.experienceYears} years` },
                      { icon: Users, l: "Grade range", v: `${gradeShort(tutor.gradeMin)} – ${gradeShort(tutor.gradeMax)}` },
                      { icon: Clock, l: "30-min", v: money(tutor.rate30) },
                      { icon: CalendarDays, l: "Available", v: tutor.days.join(" · ") },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl border border-line bg-cream px-4 py-3">
                        <s.icon size={16} className="text-royal" />
                        <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-sub">{s.l}</div>
                        <div className="text-[13.5px] font-extrabold">{s.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {tutor.subjects.map((s) => (
                      <Badge key={s} tone="blue" className="capitalize">{SUBJECT_MAP[s]?.name ?? s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <h2 className="font-display text-[20px] font-bold">About</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink/80">{tutor.bio}</p>
              <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sub">Teaching approach</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink/80">{tutor.approach}</p>
              <h3 className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-sub">Qualifications</h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {tutor.qualifications.map((qq) => (
                  <li key={qq} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-ink/85">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf"><Check size={11} /></span>
                    {qq}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-7">
              <h2 className="font-display text-[20px] font-bold">Availability</h2>
              <p className="mt-1 text-[13.5px] text-sub">All times shown in your local timezone. Book any open slot.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {DAYS.filter((d) => d !== "Sun").map((d) => {
                  const open = tutor.days.includes(d);
                  return (
                    <div key={d} className={`rounded-xl border p-4 text-center ${open ? "border-royal/30 bg-royal-soft" : "border-line bg-cream opacity-60"}`}>
                      <div className="text-[12px] font-extrabold uppercase tracking-wider">{d}</div>
                      {open ? (
                        <>
                          <div className="mt-2 text-[12.5px] font-bold text-royal-deep">{tutor.slotStart - 12}:00 – {tutor.slotEnd - 12}:00</div>
                          <div className="mt-1 text-[11px] font-semibold text-sub">PM</div>
                          <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-extrabold text-leaf"><span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Open</div>
                        </>
                      ) : (
                        <div className="mt-2 text-[11px] font-bold text-sub">Closed</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <div>
              <div className="mb-5 flex items-center gap-3">
                <MessageSquareQuote size={20} className="text-royal" />
                <h2 className="font-display text-[20px] font-bold">Reviews & testimonials</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {revs.map((r, i) => (
                  <Reveal key={r.id} delay={i * 80}>
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <Stars value={r.rating} size={13} />
                        <span className="text-[11.5px] font-bold text-sub">
                          {new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p className="mt-3 text-[14px] leading-relaxed text-ink/85">“{r.text}”</p>
                      <div className="mt-4 text-[13px] font-extrabold">{r.author}</div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* sticky booking column */}
          <div>
            <div className="sticky top-24 space-y-5">
              <Card className="overflow-hidden">
                <div className="bg-navy p-6 text-white">
                  <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber">
                    <Zap size={13} /> Session options
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/8 p-4">
                      <div>
                        <div className="text-[14px] font-extrabold">30-minute session</div>
                        <div className="text-[12px] text-white/60">Focused skill & homework support</div>
                      </div>
                      <div className="font-display text-[19px] font-extrabold">{money(tutor.rate30)}</div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/8 p-4">
                      <div>
                        <div className="text-[14px] font-extrabold">60-minute session</div>
                        <div className="text-[12px] text-white/60">In-depth instruction & feedback</div>
                      </div>
                      <div className="font-display text-[19px] font-extrabold">{money(tutor.rate60)}</div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="label">Start with a subject</div>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.map((s) => (
                      <Link
                        key={s}
                        href={`/book?tutor=${tutor.slug}&subject=${s}`}
                        className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13px] font-bold capitalize transition-colors hover:border-royal hover:bg-royal hover:text-white"
                      >
                        {SUBJECT_MAP[s]?.name ?? s}
                      </Link>
                    ))}
                  </div>
                  <Button href={`/book?tutor=${tutor.slug}`} variant="accent" size="lg" className="mt-5 w-full">
                    Book a Session <ArrowRight size={16} />
                  </Button>
                  <p className="mt-3 text-center text-[12px] font-semibold text-sub">
                    Free rescheduling up to 12 hours before the session.
                  </p>
                </div>
              </Card>

              <Card className="flex items-start gap-3.5 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-soft text-leaf"><Shield size={18} /></span>
                <div>
                  <div className="text-[13.5px] font-extrabold">Progress, shared with parents</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
                    Every session ends with written notes — focus areas, practice recommendations, and progress — visible in your parent dashboard.
                  </p>
                </div>
              </Card>

              <Card className="flex items-center justify-center gap-6 p-5">
                <Ring value={Math.round(rating * 20)} size={84} color="#E8962E" sub="rating" label="%" />
                <div>
                  <div className="font-display text-[15px] font-extrabold">{rating.toFixed(1)} / 5.0</div>
                  <div className="text-[12px] font-semibold text-sub">{tutor.reviewCount} parent & student reviews</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
