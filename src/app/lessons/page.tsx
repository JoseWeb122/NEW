"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Header, Footer } from "@/components/site";
import { SectionHead, Chip, Select, Input, Modal, Button, Badge, SubjectIcon, ProgressBar, EmptyState, Card } from "@/components/ui";
import { LessonCard, type LessonLite } from "@/components/cards";
import { SUBJECTS, LEVELS, GRADES, SUBJECT_MAP } from "@/lib/const";
import { api, useAuth, fmtGrade, reducedMotion } from "@/lib/client";
import {
  Play,
  Pause,
  SearchX,
  Clock,
  Check,
  Flame,
  TrendingUp,
  PlusCircle,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";

export default function LessonsPage() {
  const { user } = useAuth();
  const [all, setAll] = useState<LessonLite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [level, setLevel] = useState("");
  const [watchId, setWatchId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStudent = user?.role === "student";
  const myGrade = user?.role === "student" ? 4 : 4; // demo student Emma is Grade 4

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSubject(p.get("subject") ?? "");
    setLevel(p.get("level") ?? "");
    const g = p.get("grade");
    if (g) setGrade(g);
    const w = p.get("watch");
    if (w) setWatchId(Number(w));
  }, []);

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    if (subject) sp.set("subject", subject);
    if (difficulty) sp.set("difficulty", difficulty);
    if (isStudent) sp.set("studentId", String(user?.id ?? 1));
    return sp.toString();
  }, [subject, difficulty, isStudent, user]);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/api/lessons${params ? `?${params}` : ""}`).then((r) => {
        setAll(r);
        setLoaded(true);
      });
    }, q ? 200 : 0);
    return () => clearTimeout(t);
  }, [params, q]);

  const filtered = all
    .filter((l) => (q ? (l.title + l.topic).toLowerCase().includes(q.toLowerCase()) : true))
    .filter((l) => (grade ? l.grade === Number(grade) : true))
    .filter((l) =>
      level
        ? (() => {
            const [a, b] = level === "elementary" ? [0, 5] : level === "middle" ? [6, 8] : [9, 12];
            return l.grade >= a && l.grade <= b;
          })()
        : true
    );

  const watching = all.find((l) => l.id === watchId) ?? null;

  // playback simulation
  useEffect(() => {
    if (watching) setProgress(watching.percent ?? 0);
    setPlaying(!!watching);
  }, [watchId, watching?.id]);

  useEffect(() => {
    if (!playing || watchId == null) return;
    const step = reducedMotion() ? 25 : 4;
    const iv = setInterval(() => {
      setProgress((p) => {
        const np = Math.min(100, p + step);
        if (np >= 100) setPlaying(false);
        return np;
      });
    }, 700);
    return () => clearInterval(iv);
  }, [playing, watchId]);

  // persist progress periodically
  useEffect(() => {
    if (watchId == null || !isStudent) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api("/api/lessons/progress", {
        body: { studentId: user?.id ?? 1, lessonId: watchId, percent: progress },
      }).then(() =>
        setAll((ls) => ls.map((l) => (l.id === watchId ? { ...l, percent: progress } : l)))
      );
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [progress, watchId, isStudent, user]);

  const continueWatching = filtered.filter((l) => (l.percent ?? 0) > 0 && (l.percent ?? 0) < 100);
  const completed = filtered.filter((l) => (l.percent ?? 0) === 100);
  const popular = [...filtered].sort((a, b) => (b as LessonLite & { popularity?: number }).popularity! - (a as LessonLite & { popularity?: number }).popularity!).slice(0, 4);
  const recent = [...filtered].reverse().slice(0, 4);
  const recommended = [...filtered]
    .sort((a, b) => (a.grade === myGrade ? -1 : 0) - (b.grade === myGrade ? -1 : 0) || a.grade - b.grade)
    .slice(0, 4);

  const Row = ({ title, icon, lessons, empty }: { title: string; icon?: ReactNode; lessons: LessonLite[]; empty?: string }) => (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-display text-[19px] font-bold">{title}</h2>
        <span className="text-[12.5px] font-bold text-sub">({lessons.length})</span>
      </div>
      {lessons.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white px-5 py-6 text-[13px] font-semibold text-sub">{empty}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {lessons.map((l, i) => (
            <LessonCard key={l.id} lesson={l} index={i} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* library hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="bg-dots-dark absolute inset-0 opacity-40" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-royal/25 blur-3xl" />
        <div className="wrap relative py-14">
          <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.16em] text-amber">
            <Play size={13} className="fill-amber" /> Recorded Lesson Library
          </div>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-[44px]">
            Learn on demand, at your child's pace
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] text-white/70">
            {all.length} professional lessons across five subjects — organized by grade and topic, with progress tracked automatically.
          </p>

          <div className="card mt-8 max-w-4xl space-y-4 bg-white p-5 text-ink">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <SearchX size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
                <Input placeholder="Search lessons or topics…" className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="">Any grade</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Select>
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">Any difficulty</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </Select>
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">All levels</option>
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={!subject} onClick={() => setSubject("")} className="bg-white">All subjects</Chip>
              {SUBJECTS.map((s) => (
                <Chip key={s.slug} active={subject === s.slug} onClick={() => setSubject(subject === s.slug ? "" : s.slug)} className={subject === s.slug ? "" : "bg-white"}>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap space-y-14 py-14">
        {!loaded ? (
          <div className="py-20 text-center text-sm font-bold text-sub">Loading library…</div>
        ) : (
          <>
            {isStudent && (continueWatching.length > 0 || completed.length > 0) && (
              <Row
                title="Continue Watching"
                icon={<Flame size={18} className="text-amber-deep" />}
                lessons={[...continueWatching, ...completed].slice(0, 4)}
                empty="Nothing in progress yet."
              />
            )}
            <Row
              title="Popular Lessons"
              icon={<TrendingUp size={18} className="text-royal" />}
              lessons={popular}
              empty="No lessons match your filters."
            />
            <Row
              title="Recently Added"
              icon={<PlusCircle size={18} className="text-leaf" />}
              lessons={recent}
              empty="No new lessons match your filters."
            />
            <Row
              title={isStudent ? "Recommended for Emma (Grade 4)" : "Recommended"}
              icon={<Sparkles size={18} className="text-amber-deep" />}
              lessons={recommended}
              empty="No recommendations right now."
            />
          </>
        )}
      </div>

      {/* player modal */}
      <Modal open={!!watching} onClose={() => setWatchId(null)} wide title={watching ? watching.title : ""}>
        {watching && (
          <div className="grid gap-6 lg:grid-cols-[1fr_270px]">
            <div>
              <div
                className="relative aspect-video overflow-hidden rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${(SUBJECT_MAP[watching.subject]?.color ?? "#2B50C8")} 0%, #0E1B33 130%)`,
                }}
              >
                <div className="bg-dots-dark absolute inset-0 opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {playing ? (
                    <span className="grid h-16 w-16 animate-pulse place-items-center rounded-full bg-white/15 backdrop-blur">
                      <SubjectIcon slug={watching.subject} size={30} className="text-white" />
                    </span>
                  ) : (
                    <button
                      onClick={() => setPlaying(true)}
                      className="grid h-18 w-18 cursor-pointer place-items-center rounded-full bg-white p-5 text-navy shadow-xl transition-transform hover:scale-105"
                      aria-label="Play"
                    >
                      <Play size={30} className="ml-1 fill-navy" />
                    </button>
                  )}
                </div>
                {/* seek bar */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-4 pt-10">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div className="h-full bg-amber transition-[width] duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[12px] font-bold text-white">
                    <span className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setPlaying((p) => !p)}
                        className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/15 hover:bg-white/25"
                        aria-label={playing ? "Pause" : "Play"}
                      >
                        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                      {Math.round((progress / 100) * watching.durationMin)} min / {watching.durationMin} min
                    </span>
                    <span>{progress}% watched</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={progress >= 100}
                  onClick={() => {
                    setProgress(100);
                    setPlaying(false);
                    if (isStudent)
                      api("/api/lessons/progress", { body: { studentId: user?.id ?? 1, lessonId: watching.id, percent: 100 } }).then(() =>
                        setAll((ls) => ls.map((l) => (l.id === watching.id ? { ...l, percent: 100 } : l)))
                      );
                  }}
                >
                  <Check size={14} /> Mark as complete
                </Button>
                {!isStudent && (
                  <span className="text-[12px] font-semibold text-sub">
                    Sign in as a student to save progress to a profile.
                  </span>
                )}
                {progress >= 100 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-3 py-1.5 text-[12px] font-extrabold text-leaf">
                    <Check size={13} /> Completed — added to your record
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge tone="blue" className="capitalize">{watching.subject}</Badge>
                <Badge tone="outline">{fmtGrade(watching.grade)}</Badge>
              </div>
              <p className="text-[13.5px] leading-relaxed text-sub">{watching.description}</p>
              <div className="space-y-2.5 rounded-xl border border-line bg-cream p-4 text-[12.5px] font-bold">
                <div className="flex justify-between"><span className="text-sub">Topic</span><span>{watching.topic}</span></div>
                <div className="flex justify-between"><span className="text-sub">Duration</span><span className="inline-flex items-center gap-1"><Clock size={12} /> {watching.durationMin} min</span></div>
                <div className="flex justify-between"><span className="text-sub">Difficulty</span><span>{watching.difficulty}</span></div>
              </div>
              <div>
                <ProgressBar value={progress} color="#E8962E" />
                <div className="mt-1.5 text-[11.5px] font-bold text-sub">Your progress</div>
              </div>
              {recommended[0] && recommended[0].id !== watching.id && (
                <button
                  onClick={() => setWatchId(recommended[0].id)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-3 text-left hover:border-royal"
                >
                  <SubjectIcon slug={recommended[0].subject} withBg size={18} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-sub">Up next</span>
                    <span className="block truncate text-[13px] font-bold">{recommended[0].title}</span>
                  </span>
                  <ArrowRight size={15} className="text-royal transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
