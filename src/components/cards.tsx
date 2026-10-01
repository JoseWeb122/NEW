"use client";

import Link from "next/link";
import {
  ArrowRight,
  Play,
  Clock,
  Users,
  CalendarDays,
  Star,
} from "lucide-react";
import { Avatar, Badge, Card, ProgressBar, SubjectIcon, Stars, cn } from "./ui";
import { gradeLabel, SUBJECT_MAP } from "@/lib/const";
import { money, fmtGrade } from "@/lib/client";

export interface TutorLite {
  id: number;
  name: string;
  slug: string;
  title: string;
  photo: string | null;
  subjects: string[];
  gradeMin: number;
  gradeMax: number;
  bio: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  rate30: number;
  rate60: number;
  formats: string[];
  days: string[];
  slotStart?: number;
  slotEnd?: number;
}

export function TutorCard({ tutor, index = 0 }: { tutor: TutorLite; index?: number }) {
  const range =
    tutor.gradeMin === tutor.gradeMax
      ? gradeLabel(tutor.gradeMin)
      : `${fmtGrade(tutor.gradeMin)} – ${fmtGrade(tutor.gradeMax)}`;
  return (
    <Card
      lift
      className="anim-fade-up flex flex-col overflow-hidden"
    >
      <div
        className="relative"
        style={{ animationDelay: `${index * 80}ms`, background: "linear-gradient(180deg, #E9EEFC 0%, #ffffff 90%)" }}
      >
        <div className="flex items-start gap-4 p-5 pb-4">
          <Avatar name={tutor.name} photo={tutor.photo} size={64} />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[17px] font-bold leading-tight">{tutor.name}</h3>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-sub">{tutor.title}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <Stars value={tutor.rating} size={12} />
              <span>{tutor.rating.toFixed(1)}</span>
              <span className="font-semibold text-sub">({tutor.reviewCount})</span>
            </div>
          </div>
          <Badge tone="green" dot>{tutor.experienceYears} yrs exp</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 px-5">
          {tutor.subjects.map((s) => (
            <Badge key={s} tone="blue">{s}</Badge>
          ))}
          <Badge tone="outline">{range}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3">
        <p className="line-clamp-2 text-[13px] leading-relaxed text-sub">{tutor.bio}</p>
        <div className="mt-3 flex items-center gap-3 text-[12px] font-bold text-sub">
          <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {tutor.days.join(" · ")}</span>
          <span className="ml-auto font-display text-[15px] font-extrabold text-ink">
            {money(tutor.rate30)}
            <span className="text-[11px] font-bold text-sub"> /30 min</span>
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-line pt-4">
          <Link
            href={`/tutors/${tutor.slug}`}
            className="rounded-[10px] border border-line bg-white py-2.5 text-center text-[13px] font-bold text-ink transition-colors hover:border-royal hover:text-royal"
          >
            View Profile
          </Link>
          <Link
            href={`/book?tutor=${tutor.slug}`}
            className="rounded-[10px] bg-royal py-2.5 text-center text-[13px] font-bold text-white transition-colors hover:bg-royal-deep"
          >
            Book Session
          </Link>
        </div>
      </div>
    </Card>
  );
}

export interface ClassLite {
  id: number;
  title: string;
  subject: string;
  grade: number;
  day: string;
  time: string;
  durationMin: number;
  capacity: number;
  enrolled: number;
  fee: number;
  description: string;
  tutor: { name: string; photo: string | null } | null;
}

export function ClassCard({ cls, index = 0 }: { cls: ClassLite; index?: number }) {
  const sub = SUBJECT_MAP[cls.subject];
  const seatsLeft = Math.max(0, cls.capacity - cls.enrolled);
  return (
    <Card lift className="anim-fade-up flex flex-col overflow-hidden" >
      <div style={{ animationDelay: `${index * 80}ms` }} className="flex flex-1 flex-col">
        <div className="h-1.5 w-full" style={{ background: sub?.color ?? "#2B50C8" }} />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2">
            <Badge tone="blue" className="capitalize">{cls.subject}</Badge>
            <Badge tone="outline">{gradeLabel(cls.grade)}</Badge>
            <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-sub">
              <Clock size={13} /> {cls.durationMin} min
            </span>
          </div>
          <h3 className="mt-3 font-display text-[16.5px] font-bold leading-snug">{cls.title}</h3>
          {cls.tutor && (
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar name={cls.tutor.name} photo={cls.tutor.photo} size={30} rounded="rounded-full" />
              <span className="text-[13px] font-bold text-ink">{cls.tutor.name}</span>
            </div>
          )}
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-sub">{cls.description}</p>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between text-[12.5px] font-bold">
              <span className="inline-flex items-center gap-1.5 text-ink">
                <CalendarDays size={14} className="text-royal" />
                {cls.day} · {cls.time}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sub">
                <Users size={14} /> {cls.enrolled}/{cls.capacity}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <ProgressBar
                value={(cls.enrolled / cls.capacity) * 100}
                color={seatsLeft <= 2 ? "#C24A3D" : "#1E7A55"}
                size="sm"
                className="flex-1"
              />
              <span className={cn("text-[11px] font-bold", seatsLeft <= 2 ? "text-clay" : "text-leaf")}>
                {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-sub">
                {cls.fee > 0 ? <>{money(cls.fee)}<span className="text-[11px]"> / month</span></> : "Included in plan"}
              </span>
              <Link
                href={`/classes?join=${cls.id}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-navy px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-navy-2"
              >
                Join Class <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export interface LessonLite {
  id: number;
  title: string;
  subject: string;
  grade: number;
  topic: string;
  difficulty: string;
  durationMin: number;
  description: string;
  percent?: number;
}

export function LessonCard({ lesson, index = 0 }: { lesson: LessonLite; index?: number }) {
  const sub = SUBJECT_MAP[lesson.subject];
  const color = sub?.color ?? "#2B50C8";
  return (
    <Link
      href={`/lessons?watch=${lesson.id}`}
      className="anim-fade-up group block w-full"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Card lift className="overflow-hidden">
        <div
          className="relative aspect-[16/10] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 55%, #0E1B33 130%)`,
          }}
        >
          <div className="bg-dots-dark absolute inset-0 opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
              style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(4px)" }}
            >
              <SubjectIcon slug={lesson.subject} size={30} />
            </span>
          </div>
          <span className="absolute left-3 top-3 rounded-md bg-navy/70 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
            {lesson.subject}
          </span>
          <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold text-navy">
            {gradeLabel(lesson.grade)}
          </span>
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-navy/70 px-2 py-1 text-[11px] font-bold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <Play size={11} className="fill-white" /> Watch
          </span>
          {lesson.percent !== undefined && lesson.percent > 0 && lesson.percent < 100 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
              <div className="h-full bg-amber" style={{ width: `${lesson.percent}%` }} />
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="line-clamp-1 font-display text-[14.5px] font-bold leading-snug">{lesson.title}</h4>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-sub">{lesson.description}</p>
          <div className="mt-3 flex items-center gap-3 text-[11.5px] font-bold text-sub">
            <span className="inline-flex items-center gap-1"><Clock size={12} /> {lesson.durationMin} min</span>
            <span className={cn(
              "rounded-full px-2 py-0.5",
              lesson.difficulty === "Beginner" ? "bg-leaf-soft text-leaf" :
              lesson.difficulty === "Intermediate" ? "bg-amber-soft text-amber-deep" : "bg-royal-soft text-royal-deep"
            )}>
              {lesson.difficulty}
            </span>
            {lesson.percent !== undefined && (
              <span className="ml-auto">{lesson.percent === 100 ? "Completed ✓" : `${lesson.percent}%`}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function TestimonialCard({
  name,
  role,
  quote,
  index = 0,
}: {
  name: string;
  role: string;
  quote: string;
  index?: number;
}) {
  return (
    <Card className="anim-fade-up flex flex-col p-6" >
      <div style={{ animationDelay: `${index * 90}ms` }} className="flex h-full flex-col">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} className="fill-amber text-amber" />
          ))}
        </div>
        <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink/85">“{quote}”</p>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <Avatar name={name} size={38} hue={200 + index * 40} rounded="rounded-full" />
          <div>
            <div className="text-[13.5px] font-bold">{name}</div>
            <div className="text-[12px] font-semibold text-sub">{role}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
