"use client";

import { useEffect, useMemo, useState } from "react";
import { Header, Footer } from "@/components/site";
import { SectionHead, Chip, Input, Select, EmptyState, Button } from "@/components/ui";
import { TutorCard, type TutorLite } from "@/components/cards";
import { SUBJECTS, LEVELS, GRADES, DAYS } from "@/lib/const";
import { api } from "@/lib/client";
import { SearchX, SlidersHorizontal } from "lucide-react";

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorLite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [format, setFormat] = useState("");
  const [day, setDay] = useState("");
  const [sort, setSort] = useState("rating");

  useEffect(() => {
    // read URL params once
    const p = new URLSearchParams(window.location.search);
    setSubject(p.get("subject") ?? "");
    setLevel(p.get("level") ?? "");
    setGrade(p.get("grade") ?? "");
    setFormat(p.get("format") ?? "");
  }, []);

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (subject) sp.set("subject", subject);
    if (level) sp.set("level", level);
    if (grade) sp.set("grade", grade);
    if (format) sp.set("format", format);
    if (day) sp.set("day", day);
    sp.set("sort", sort);
    return sp.toString();
  }, [q, subject, level, grade, format, day, sort]);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/api/tutors?${params}`).then((r) => {
        setTutors(r);
        setLoaded(true);
      });
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [params]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <section className="border-b border-line bg-cream">
        <div className="wrap py-14">
          <SectionHead
            eyebrow="Find a Tutor"
            title="Browse our teaching team"
            sub="Filter by subject, grade, availability, and format. Every tutor teaches defined grade bands with a documented teaching approach."
          />

          <div className="card space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <SearchX size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
                <Input
                  placeholder="Search by tutor name, subject, or specialty…"
                  className="pl-10"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">All subjects</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </Select>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">All levels</option>
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
                <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">Any grade</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Select>
                <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="">Any format</option>
                  <option value="1on1">1-on-1</option>
                  <option value="group">Group</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase tracking-wider text-sub">
                <SlidersHorizontal size={13} /> Available on
              </span>
              {DAYS.filter((d) => d !== "Sun").map((d) => (
                <Chip key={d} active={day === d} onClick={() => setDay(day === d ? "" : d)}>
                  {d}
                </Chip>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11.5px] font-extrabold uppercase tracking-wider text-sub">Sort</span>
                <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto py-1.5 text-[13px]">
                  <option value="rating">Top rated</option>
                  <option value="experience">Most experienced</option>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-bold text-sub">
            {loaded ? <>{tutors.length} tutor{tutors.length === 1 ? "" : "s"} available</> : "Loading tutors…"}
          </p>
          <Button href="/book" variant="primary" size="sm">Book a session</Button>
        </div>
        {loaded && tutors.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No tutors match those filters"
            sub="Try widening the grade range or clearing the day filter."
            action={<Button variant="outline" onClick={() => { setQ(""); setSubject(""); setLevel(""); setGrade(""); setFormat(""); setDay(""); }}>Clear all filters</Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {tutors.map((t, i) => (
              <TutorCard key={t.id} tutor={t} index={i} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
