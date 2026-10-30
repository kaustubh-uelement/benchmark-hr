"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; links?: { label: string; href: string }[]; engine?: string };

const STARTERS: Record<string, string[]> = {
  console: ["Which tickets are overdue?", "Open leads I should call today", "Senior data people in Pune open to a startup"],
  exh1b: ["How many roles match me?", "What's left on my profile?", "How does tax residency work when I return?"],
  "golden-glove": ["How do your fees work?", "How long does a CXO search take?", "Can I register in confidence?"],
  talent: ["What roles are open?", "How do you build a GCC team?", "What are your fees?"],
  trustcircle: ["What happens in a programme?", "My role has ended. Can you help?", "How is it priced?"],
  advisory: ["Do you do labour code reviews?", "How does a retainer work?", "Can you help with succession?"],
  group: ["I need a CFO", "I'm moving back from the US", "We're restructuring a team"],
};

const SparkIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z" />
  </svg>
);

/** Floating “Ask Jev” assistant. Reads the brand theme tokens of whatever page it sits on. */
export function JevAssistant({ surface, greeting }: { surface: string; greeting?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/jev/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q, surface, history: next.map(({ role, content }) => ({ role, content })) }),
      });
      const d = await r.json();
      setMsgs([...next, { role: "assistant", content: d.text ?? d.error ?? "Sorry, something went wrong.", links: d.links, engine: d.engine }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "I couldn't reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section role="dialog" aria-label="Ask Jev" className="flex h-[min(560px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-card border border-line bg-card-2 text-ink shadow-2xl">
          <header className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-ink">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-ink">
                <SparkIcon size={16} />
              </span>
              <span className="leading-tight">
                <b className="block text-[15px]">Jev</b>
                <span className="text-xs opacity-80">Benchmark HR assistant</span>
              </span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Jev" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
              ✕
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 text-[14.5px] leading-relaxed" aria-live="polite">
            {msgs.length === 0 && (
              <div className="flex flex-col gap-3">
                <p className="m-0 text-muted">{greeting ?? "Hi, I'm Jev. I answer from Benchmark HR's own records, and I show only what you're allowed to see."}</p>
                <div className="flex flex-col gap-2">
                  {(STARTERS[surface] ?? STARTERS.group).map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-field border border-line bg-card px-3 py-2 text-left text-sm font-semibold hover:border-accent">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-line rounded-card px-3.5 py-2.5 ${m.role === "user" ? "bg-primary text-primary-ink" : "bg-bg-2"}`}>
                  {m.content}
                  {!!m.links?.length && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href + l.label} href={l.href} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent no-underline">
                          {l.label}
                        </Link>
                      ))}
                    </span>
                  )}
                  {m.engine && <span className="mt-1.5 block text-[10.5px] font-semibold uppercase tracking-wider text-faint">{m.engine === "claude" ? "Jev · Claude" : "Jev · rules engine"}</span>}
                </div>
              </div>
            ))}
            {busy && (
              <div className="mb-3 flex gap-1.5 px-1" aria-label="Jev is thinking">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor={`jev-${surface}`} className="sr-only">
              Message Jev
            </label>
            <input ref={inputRef} id={`jev-${surface}`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…" className="field !min-h-10 flex-1 !py-2 text-sm" autoComplete="off" />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-btn bg-accent px-4 text-sm font-bold text-accent-ink disabled:opacity-50">
              Send
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-ink shadow-xl ring-2 ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition hover:brightness-110"
      >
        <SparkIcon />
        {open ? "Close" : "Ask Jev"}
      </button>
    </div>
  );
}
