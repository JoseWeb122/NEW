"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/site";
import { SectionHead, Card, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/client";
import { Mail, Phone, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "New student inquiry", message: "" });

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/contact", { body: form });
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <section className="border-b border-line bg-cream">
        <div className="wrap py-14">
          <SectionHead
            eyebrow="Contact"
            title="Talk to our academy team"
            sub="Questions about programs, tutors, or enrollment? We usually reply within one business day."
          />
        </div>
      </section>

      <section className="wrap grid gap-10 py-14 lg:grid-cols-[1fr_360px]">
        <Card className="p-7">
          {sent ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-leaf-soft text-leaf">
                <CheckCircle2 size={30} />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold">Message received</h2>
              <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-sub">
                Thanks, {form.name.split(" ")[0] || "friend"}! Our enrollment team will reach out
                to <strong>{form.email}</strong> within one business day.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", email: "", topic: "New student inquiry", message: "" }); }}>
                Send another message
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name">
                  <Input required placeholder="Jane Rivera" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Email address">
                  <Input required type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              </div>
              <Field label="Topic">
                <Select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                  <option>New student inquiry</option>
                  <option>Group class enrollment</option>
                  <option>Billing & payments</option>
                  <option>Tutor partnership</option>
                  <option>Technical support</option>
                  <option>Other</option>
                </Select>
              </Field>
              <Field label="Message">
                <Textarea
                  required
                  rows={6}
                  placeholder="Tell us about your child's grade, the subjects you'd like support in, and any preferred schedules…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </Field>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[12px] font-semibold text-sub">
                  We'll only use your details to respond to this inquiry.
                </p>
                <Button variant="accent" disabled={busy || !form.name || !form.email || !form.message} onClick={submit}>
                  <Send size={15} /> {busy ? "Sending…" : "Send message"}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h3 className="font-display text-[16px] font-bold">Contact details</h3>
            <ul className="mt-4 space-y-4 text-[13.5px]">
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-royal-soft text-royal"><Mail size={16} /></span>
                <div><div className="font-extrabold">Email</div><div className="text-sub">hello@jstutoring.academy</div></div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber-deep"><Phone size={16} /></span>
                <div><div className="font-extrabold">Phone</div><div className="text-sub">(555) 014-7788 · Mon–Sat</div></div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-leaf-soft text-leaf"><Clock size={16} /></span>
                <div><div className="font-extrabold">Hours</div><div className="text-sub">Office 8 AM – 6 PM · Sessions 3 – 8 PM daily</div></div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink/6 text-ink"><MapPin size={16} /></span>
                <div><div className="font-extrabold">Headquarters</div><div className="text-sub">128 Academy Way, Suite 300</div></div>
              </li>
            </ul>
          </Card>
          <Card className="bg-navy p-6 text-white">
            <h3 className="font-display text-[16px] font-bold">In a hurry?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/70">
              Skip the queue — book a free 15-minute assessment call and we'll match you with the
              right tutor on the spot.
            </p>
            <Button href="/book" variant="accent" size="sm" className="mt-4">Book a free assessment</Button>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
