"use client";

import { useOptimistic, useTransition } from "react";

type Item = { id: number; title: string; detail: string; done: boolean; specific: boolean };

export function Checklist({ sections, onToggle }: { sections: { name: string; items: Item[] }[]; onToggle: (id: number, done: boolean) => Promise<void> }) {
  const all = sections.flatMap((s) => s.items);
  const [state, setOpt] = useOptimistic(Object.fromEntries(all.map((i) => [i.id, i.done])) as Record<number, boolean>, (cur, [id, v]: [number, boolean]) => ({ ...cur, [id]: v }));
  const [, start] = useTransition();
  const doneCount = Object.values(state).filter(Boolean).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-2" role="progressbar" aria-valuenow={doneCount} aria-valuemax={all.length} aria-label="Checklist progress">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(doneCount / all.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold tabular-nums">
          {doneCount}/{all.length} done
        </span>
        <span className="text-xs text-faint">Saved automatically</span>
      </div>
      {sections.map((s) => {
        const d = s.items.filter((i) => state[i.id]).length;
        return (
          <section key={s.name}>
            <h3 className="m-0 mb-2 flex items-center justify-between font-display text-lg font-bold">
              {s.name}
              <span className="text-sm font-semibold text-faint">
                {d}/{s.items.length}
              </span>
            </h3>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {s.items.map((i) => (
                <li key={i.id}>
                  <label className={`flex cursor-pointer gap-3 rounded-field border border-line p-3 transition ${state[i.id] ? "bg-bg-2" : "bg-card hover:border-accent"}`}>
                    <input
                      type="checkbox"
                      checked={!!state[i.id]}
                      onChange={(e) => {
                        const v = e.target.checked;
                        start(async () => {
                          setOpt([i.id, v]);
                          await onToggle(i.id, v);
                        });
                      }}
                      className="mt-0.5 h-5 w-5 flex-none accent-[var(--accent)]"
                    />
                    <span>
                      <span className={`block font-semibold ${state[i.id] ? "text-muted line-through" : ""}`}>
                        {i.title} {i.specific && <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent no-underline">For your country</span>}
                      </span>
                      <span className="block text-sm text-muted">{i.detail}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
