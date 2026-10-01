"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Stars, Modal, Field, Textarea } from "@/components/ui";
import { api, useAuth } from "@/lib/client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PhoneOff,
  Send,
  FileText,
  Download,
  Star,
  X,
  Hand,
} from "lucide-react";

const SEED_CHAT = [
  { who: "Sarah J.", me: false, text: "Hey Emma! Ready to tackle fractions today? 🎯", t: "0:05" },
  { who: "You", me: true, text: "Hi Sarah! I finished the worksheet last night!", t: "0:12" },
  { who: "Sarah J.", me: false, text: "Awesome. I've shared the practice set — we'll do the first three together.", t: "0:21" },
];

const MATERIALS = [
  { name: "fractions_practice_set.pdf", size: "1.2 MB", kind: "PDF" },
  { name: "equivalent_fractions_study_guide.pdf", size: "860 KB", kind: "PDF" },
  { name: "session_notes_template.docx", size: "210 KB", kind: "DOC" },
];

export default function LivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [tab, setTab] = useState<"chat" | "materials">("chat");
  const [chat, setChat] = useState(SEED_CHAT);
  const [draft, setDraft] = useState("");
  const [ending, setEnding] = useState(false);
  const [rating, setRating] = useState(5);
  const [wentWell, setWentWell] = useState("");
  const [toImprove, setToImprove] = useState("");
  const [saved, setSaved] = useState(false);
  const [raised, setRaised] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Read the query string after mount so server and client markup match (no hydration errors).
  const [tutorName, setTutorName] = useState("Sarah Johnson");
  const [subject, setSubject] = useState("Math");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tutor");
    if (t) setTutorName(t.replace(/_/g, " "));
    const s = q.get("subject");
    if (s) setSubject(s.charAt(0).toUpperCase() + s.slice(1));
  }, []);
  const short = tutorName
    .split(" ")
    .map((p, i) => (i === 0 ? p : `${p.charAt(0)}.`))
    .join(" ");

  useEffect(() => {
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [chat]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const send = () => {
    if (!draft.trim()) return;
    setChat((c) => [...c, { who: "You", me: true, text: draft.trim(), t: `${mm}:${ss}` }]);
    setDraft("");
    setTimeout(() => {
      setChat((c) => [
        ...c,
        {
          who: short,
          me: false,
          text: "Nice work — let's check that answer together on the shared screen.",
          t: `${mm}:${ss}`,
        },
      ]);
    }, 1400);
  };

  const saveFeedback = async () => {
    if (user?.role === "tutor") {
      await api("/api/notes", {
        body: {
          tutorId: user.id,
          studentId: 1,
          summary: wentWell || `Live ${subject} session completed`,
          focus: toImprove || "Continue daily practice",
          practice: "Recommended practice: 15 min of worked examples before next session",
        },
      }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => router.push(user?.role === "tutor" ? "/portal/tutor" : "/portal/student"), 1200);
  };

  const ctrl = (active: boolean, on: string, off: string) =>
    `grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-all duration-200 ${
      active ? "bg-white/15 text-white hover:bg-white/25" : "bg-white/5 text-white/40 hover:bg-white/10"
    } ${on === off ? "" : ""}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#0A1220] text-white">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-royal font-display text-[13px] font-extrabold">
            JS
            <span className="absolute -bottom-1 left-0 h-1.5 w-full bg-amber/90" />
          </span>
          <div>
            <div className="text-[13.5px] font-extrabold leading-tight">{subject} · Live Session</div>
            <div className="text-[11px] font-semibold text-white/50">with {tutorName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-clay/20 px-3 py-1 text-[11px] font-extrabold text-red-400 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 anim-rec" /> REC
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-1.5 font-mono text-[13px] font-bold text-white/90">
            {mm}:{ss}
          </span>
        </div>
      </div>

      <div className="grid flex-1 gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_340px]">
        {/* stage */}
        <div className="flex min-h-[320px] flex-col gap-4">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12203A] via-[#0E1830] to-[#0A1220]">
            <div className="bg-dots-dark absolute inset-0 opacity-30" />
            {sharing ? (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-[#0F1B31] p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[12px] font-extrabold text-amber">
                      <MonitorUp size={14} /> {short} is sharing their screen
                    </span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/60">fractions_worksheet.pdf</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[92, 78, 88, 60, 71].map((w, i) => (
                      <div key={i} className="h-4 rounded bg-white/8" style={{ width: `${w}%` }} />
                    ))}
                    <div className="pt-2 font-mono text-[13px] text-white/70">
                      3/4 = ?/12 · multiply top and bottom by <span className="text-amber">4</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  <span className={`absolute -inset-4 rounded-full bg-royal/20 blur-xl transition-opacity ${camOn ? "opacity-100" : "opacity-0"}`} />
                  <Avatar name={tutorName} size={150} hue={225} rounded="rounded-full" className="relative ring-4 ring-white/10" />
                </div>
                {camOn ? (
                  <div className="mt-5 flex items-center gap-3">
                    <span className="font-display text-[20px] font-extrabold">{tutorName}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf/20 px-2.5 py-1 text-[11px] font-extrabold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Camera on
                    </span>
                  </div>
                ) : (
                  <div className="mt-5 text-[13px] font-bold text-white/50">Video paused</div>
                )}
                {/* subtle waveform */}
                <div className="mt-5 flex h-6 items-end gap-1">
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-royal/70"
                      style={{
                        height: `${h * 100}%`,
                        animation: micOn ? `pulseDot ${0.9 + i * 0.13}s ease-in-out infinite` : "none",
                        opacity: micOn ? 1 : 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* self view */}
            <div className="absolute bottom-4 right-4 w-[120px] overflow-hidden rounded-xl border-2 border-white/20 bg-[#0F1B31] shadow-xl sm:w-[150px]">
              <div className="flex aspect-[4/3] items-center justify-center">
                <Avatar name={user?.name ?? "Emma Rivera"} size={44} hue={160} rounded="rounded-full" />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[10.5px] font-extrabold">You</span>
                {micOn ? <Mic size={11} className="text-emerald-400" /> : <MicOff size={11} className="text-red-400" />}
              </div>
            </div>
            {raised && (
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-amber px-3.5 py-1.5 text-[12px] font-extrabold text-navy">
                <Hand size={14} /> You raised your hand
              </div>
            )}
          </div>

          {/* participants */}
          <div className="flex items-center gap-2.5 overflow-x-auto">
            {[tutorName, "Emma Rivera"].map((p, i) => (
              <div key={p} className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4">
                <Avatar name={p} size={28} hue={i === 0 ? 225 : 160} rounded="rounded-full" />
                <span className="text-[12px] font-bold">{i === 0 ? p : "You"}</span>
                {i === 0 && <Mic size={12} className="text-emerald-400" />}
              </div>
            ))}
            <button onClick={() => setRaised((r) => !r)} className="shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[12px] font-bold text-white/70 hover:bg-white/10">
              + Raise hand
            </button>
          </div>
        </div>

        {/* side panel */}
        <div className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="flex border-b border-white/10">
            {(
              [
                { id: "chat", label: "Chat", icon: MessageSquare },
                { id: "materials", label: "Materials", icon: FileText },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 py-3.5 text-[12.5px] font-extrabold transition-colors ${
                  tab === t.id ? "border-b-2 border-amber text-white" : "text-white/45 hover:text-white/75"
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <>
              <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {chat.map((m, i) => (
                  <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold leading-relaxed ${
                        m.me ? "rounded-br-md bg-royal text-white" : "rounded-bl-md bg-white/10 text-white/90"
                      }`}
                    >
                      {!m.me && <div className="text-[10.5px] font-extrabold text-amber">{short}</div>}
                      {m.text}
                      <div className={`mt-1 text-[10px] font-bold ${m.me ? "text-white/50" : "text-white/35"}`}>{m.t}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full bg-white/8 px-4 py-2.5 text-[13px] font-semibold text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-royal"
                />
                <button onClick={send} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-amber text-navy transition-colors hover:bg-amber-deep hover:text-white" aria-label="Send">
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              <p className="text-[11.5px] font-bold text-white/40">Shared in this session</p>
              {MATERIALS.map((m) => (
                <div key={m.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-royal/25 text-royal">
                    <FileText size={16} className="text-amber" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-bold">{m.name}</div>
                    <div className="text-[11px] font-semibold text-white/40">{m.kind} · {m.size}</div>
                  </div>
                  <button className="cursor-pointer rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Download ${m.name}`}>
                    <Download size={15} />
                  </button>
                </div>
              ))}
              <div className="rounded-xl bg-amber/10 p-3.5 text-[12px] font-semibold text-amber">
                Materials stay in your lesson library after the session ends.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-2.5 border-t border-white/10 px-4 py-4 sm:gap-4">
        <button onClick={() => setMicOn((v) => !v)} className={ctrl(micOn, "a", "b")} aria-label="Toggle microphone">
          {micOn ? <Mic size={19} /> : <MicOff size={19} />}
        </button>
        <button onClick={() => setCamOn((v) => !v)} className={ctrl(camOn, "a", "b")} aria-label="Toggle camera">
          {camOn ? <Video size={19} /> : <VideoOff size={19} />}
        </button>
        <button
          onClick={() => setSharing((v) => !v)}
          className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-all ${
            sharing ? "bg-amber text-navy hover:brightness-95" : "bg-white/15 text-white hover:bg-white/25"
          }`}
          aria-label="Toggle screen share"
        >
          <MonitorUp size={19} />
        </button>
        <button
          onClick={() => setEnding(true)}
          className="mx-2 flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-clay px-6 text-[14px] font-extrabold text-white transition-all hover:brightness-110 sm:px-8"
        >
          <PhoneOff size={18} /> <span className="hidden sm:inline">End Session</span>
        </button>
      </div>

      {/* end-of-session feedback */}
      <Modal open={ending} onClose={() => (saved ? router.push(user?.role === "tutor" ? "/portal/tutor" : "/portal/student") : setEnding(false))} title={saved ? "Feedback saved" : "How did the session go?"}>
        {saved ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-soft text-leaf">
              <Star size={28} className="fill-leaf" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold">Thanks — {tutorName.split(" ")[0]} has been notified</h3>
            <p className="mt-2 text-[13.5px] text-sub">Your feedback was added to your learning record.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={tutorName} size={48} hue={225} rounded="rounded-full" />
              <div>
                <div className="font-display text-[15.5px] font-bold">{tutorName}</div>
                <div className="text-[12px] font-semibold text-sub">
                  {subject} · {mm}:{ss} · Session complete
                </div>
              </div>
              <button onClick={() => setEnding(false)} className="ml-auto cursor-pointer rounded-lg p-1.5 text-sub hover:bg-ink/5" aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <div className="text-center">
              <div className="label">Rate this session</div>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setRating(i)} className="cursor-pointer" aria-label={`${i} stars`}>
                    <Star size={30} className={i <= rating ? "fill-amber text-amber" : "text-ink/20 hover:text-ink/40"} />
                  </button>
                ))}
              </div>
            </div>
            <Field label="What went well?">
              <Textarea rows={2} placeholder="e.g. The fraction visuals really helped me understand." value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
            </Field>
            <Field label="What should we work on next?">
              <Textarea rows={2} placeholder="e.g. More word problems before the test." value={toImprove} onChange={(e) => setToImprove(e.target.value)} />
            </Field>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEnding(false)}>
                Back to session
              </Button>
              <Button variant="primary" className="flex-1" onClick={saveFeedback}>
                Submit feedback
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
