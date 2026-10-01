import Link from "next/link";
import { Header, Footer } from "@/components/site";
import { SectionHead, Card, Reveal, Badge } from "@/components/ui";
import { MEDIA, SUBJECTS, TESTIMONIALS } from "@/lib/const";
import { Target, Shield, LineChart, HeartHandshake, ArrowRight, BookOpenCheck } from "lucide-react";

export const dynamic = "force-static";

const VALUES = [
  {
    icon: Target,
    title: "Academic rigor, always",
    desc: "Every lesson is structured around the skills and standards your child actually faces in school — nothing fluffy, nothing filler.",
  },
  {
    icon: HeartHandshake,
    title: "Warmth and patience",
    desc: "Tutors are selected for how they make students feel as much as what they know. Confidence is a skill we teach on purpose.",
  },
  {
    icon: LineChart,
    title: "Measurable growth",
    desc: "Progress isn't a feeling — it's completed lessons, assignments, attendance, and documented skill gains, all visible to parents.",
  },
  {
    icon: Shield,
    title: "Safe and professional",
    desc: "Verified tutors, protected sessions, and a parent dashboard that keeps families in the loop at every step.",
  },
];

const TEAM = [
  { name: "Jordan S.", role: "Founder & Head of Academics", photo: MEDIA.tutors["sarah-johnson"] },
  { name: "David Okafor", role: "Director of Math & Science", photo: MEDIA.tutors["david-okafor"] },
  { name: "Maria Santos", role: "Lead, Early Literacy", photo: MEDIA.tutors["maria-santos"] },
  { name: "Priya Nair", role: "Lead, English & Writing", photo: MEDIA.tutors["priya-nair"] },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <section className="relative overflow-hidden border-b border-line bg-cream">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(70%_80%_at_30%_20%,black,transparent)]" />
        <div className="wrap relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <Reveal>
              <Badge tone="blue">About JS Tutoring Academy</Badge>
              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-[48px]">
                A serious K–12 academy with modern technology behind it
              </h1>
              <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-sub">
                JS Tutoring Academy was built on a simple belief: every student — from their very
                first sight words to their final high-school semester — deserves structured,
                personal academic support. We combine experienced tutors with a modern learning
                platform so growth is consistent, visible, and measurable.
              </p>
              <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-sub">
                Our tutors teach the grade bands they specialize in. Our platform records every
                lesson, session, and skill — so parents never have to guess how learning is
                going, and students always know what comes next.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <div className="relative">
              <div className="overflow-hidden rounded-[20px] border-4 border-white shadow-[0_30px_70px_-24px_rgb(19_28_46/0.4)]">
                <img src={MEDIA.about} alt="Tutor supporting a student" className="aspect-[4/3] w-full object-cover" />
              </div>
              <Card className="absolute -bottom-6 -left-5 flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-royal text-white"><BookOpenCheck size={20} /></span>
                <div>
                  <div className="font-display text-[15px] font-extrabold">K – Grade 12</div>
                  <div className="text-[12px] font-bold text-sub">Every grade, five core subjects</div>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wrap py-20">
        <SectionHead eyebrow="Our Values" title="What we optimize for" center />
        <div className="grid gap-5 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={(i % 2) * 100}>
              <Card lift className="flex gap-5 p-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy text-amber">
                  <v.icon size={22} />
                </span>
                <div>
                  <h3 className="font-display text-[17px] font-bold">{v.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-sub">{v.desc}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-cream py-20">
        <div className="wrap">
          <SectionHead
            eyebrow="What We Teach"
            title="Five core subjects, one standard of care"
            action={<Link href="/subjects" className="inline-flex items-center gap-1.5 text-[14px] font-extrabold text-royal hover:gap-2.5 transition-all">Full directory <ArrowRight size={15} /></Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SUBJECTS.map((s) => (
              <div key={s.slug} className="rounded-xl border border-line bg-white p-5">
                <div className="h-1.5 w-10 rounded-full" style={{ background: s.color }} />
                <h3 className="mt-3 font-display text-[15.5px] font-bold">{s.name}</h3>
                <p className="mt-1 text-[12px] font-semibold text-sub">{s.grades}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-20">
        <SectionHead eyebrow="Leadership" title="The team behind the academy" center />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <Card lift className="overflow-hidden text-center">
                <img src={t.photo} alt={t.name} className="aspect-square w-full object-cover" />
                <div className="p-5">
                  <div className="font-display text-[15.5px] font-bold">{t.name}</div>
                  <div className="mt-1 text-[12.5px] font-semibold text-sub">{t.role}</div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <div className="wrap">
          <Reveal>
            <Card className="flex flex-col items-center gap-5 bg-navy p-10 text-center">
              <h2 className="max-w-xl font-display text-3xl font-extrabold text-white">
                Ready to see what structured support looks like?
              </h2>
              <p className="max-w-md text-[14px] text-white/70">
                {TESTIMONIALS[0].quote.slice(0, 120)}…
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/book" className="rounded-[10px] bg-amber px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-amber-deep">
                  Get Started
                </Link>
                <Link href="/tutors" className="rounded-[10px] border border-white/25 bg-white/10 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/20">
                  Meet the Tutors
                </Link>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
