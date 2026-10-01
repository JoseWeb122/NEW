"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/site";
import {
  SectionHead,
  SubjectIcon,
  Chip,
  Badge,
  Card,
  Avatar,
  ProgressBar,
  Button,
  EmptyState,
} from "@/components/ui";
import { TutorCard, ClassCard, LessonCard, type TutorLite, type ClassLite, type LessonLite } from "@/components/cards";
import { SUBJECTS, LEVELS, GRADES } from "@/lib/const";
import { api, fmtGrade } from "@/lib/client";
import { ArrowRight, Clock, SearchX } from "lucide-react";

export default function SubjectsPage() {
  const [level, setLevel] = useState<string>("");
  const [tutors, setTutors] = useState<TutorLite[]>([]);
  const [lessons, setLessons] = useState<LessonLite[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/api/tutors"),
      api("/api/lessons"),
      api("/api/classes"),
    ]).then(([t, l, c]) => {
      setTutors(t);
      setLessons(l);
      setClasses(c);
      setLoaded(true);
    });
  }, []);

  const inLevel = (gmin: number, gmax: number) => {
    if (!level) return true;
    const [a, b] =
      level === "elementary" ? [0, 5] : level === "middle" ? [6, 8] : [9, 12];
    return gmin <= b && gmax >= a;
  };
  const inLevelClass = (g: number) => {
    if (!level) return true;
    const [a, b] =
      level === "elementary" ? [0, 5] : level === "middle" ? [6, 8] : [9, 12];
    return g >= a && g <= b;
  };

  if (!loaded)
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="wrap py-32 text-center text-sm font-bold text-sub">Loading subject directory…</div>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <section className="border-b border-line bg-cream">
        <div className="wrap py-14">
          <SectionHead
            eyebrow="Subjects"
            title="The subject directory"
            sub="Five core subjects, each with dedicated tutors, group classes, and a growing recorded-lesson library. Filter by school level to see what's available for your child."
          />
          <div className="flex flex-wrap gap-2.5">
            <Chip active={!level} onClick={() => setLevel("")}>All levels</Chip>
            {LEVELS.map((l) => (
              <Chip key={l.id} active={level === l.id} onClick={() => setLevel(level === l.id ? "" : l.id)}>
                {l.name}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap space-y-16 py-16">
        {SUBJECTS.map((s, si) => {
          const st = tutors.filter((t) => t.subjects.includes(s.slug) && inLevel(t.gradeMin, t.gradeMax));
          const sl = lessons.filter((l) => l.subject === s.slug && inLevelClass(l.grade)).slice(0, 3);
          const sc = classes.filter((c) => c.subject === s.slug && inLevelClass(c.grade)).slice(0, 2);
          const gradesIn =
            level && inLevel(s.gradeMin, s.gradeMax) ? "In this level" : `${fmtGrade(s.gradeMin)} – Grade ${s.gradeMax}`;
          return (
            <section key={s.slug} id={s.slug} className="scroll-mt-28">
              <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
                <Card className="h-fit overflow-hidden">
                  <div className="h-1.5" style={{ background: s.color }} />
                  <div className="p-6">
                    <SubjectIcon slug={s.slug} withBg size={26} />
                    <h2 className="mt-4 font-display text-[24px] font-extrabold">{s.name}</h2>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-sub">{s.description}</p>
                    <div className="mt-4">
                      <div className="label">Available grades</div>
                      <Badge tone="blue">{gradesIn}</Badge>
                    </div>
                    <div className="mt-4">
                      <div className="label">Skills covered</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.skills.map((k) => (
                          <Badge key={k} tone="outline">{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 grid gap-2">
                      <Link href={`/tutors?subject=${s.slug}`} className="inline-flex items-center justify-between rounded-[10px] bg-navy px-4 py-3 text-[13px] font-bold text-white hover:bg-navy-2 transition-colors">
                        Explore {s.name} tutors <ArrowRight size={14} />
                      </Link>
                      <Link href={`/lessons?subject=${s.slug}`} className="inline-flex items-center justify-between rounded-[10px] border border-line bg-white px-4 py-3 text-[13px] font-bold hover:border-royal hover:text-royal transition-colors">
                        Recorded lessons <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </Card>

                <div className="space-y-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-[17px] font-bold">Tutors — {s.name}</h3>
                      <Link href={`/tutors?subject=${s.slug}`} className="text-[13px] font-bold text-royal hover:underline">
                        See all ({st.length})
                      </Link>
                    </div>
                    {st.length === 0 ? (
                      <EmptyState icon={SearchX} title="No tutors in this level" sub="Try a different level filter." />
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {st.slice(0, 3).map((t, i) => (
                          <TutorCard key={t.id} tutor={t} index={si * 3 + i} />
                        ))}
                      </div>
                    )}
                  </div>

                  {sl.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-[17px] font-bold">Recorded lessons</h3>
                        <Link href={`/lessons?subject=${s.slug}`} className="text-[13px] font-bold text-royal hover:underline">
                          View all ({lessons.filter((l) => l.subject === s.slug).length})
                        </Link>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-3">
                        {sl.map((l, i) => (
                          <LessonCard key={l.id} lesson={l} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {sc.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-[17px] font-bold">Group classes</h3>
                        <Link href={`/classes?subject=${s.slug}`} className="text-[13px] font-bold text-royal hover:underline">
                          View all
                        </Link>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        {sc.map((c, i) => (
                          <ClassCard key={c.id} cls={c} index={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}
