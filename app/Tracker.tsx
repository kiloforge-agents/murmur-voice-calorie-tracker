"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech } from "@/lib/useSpeech";
import { parseSpeech, suggest, type ParsedEntry } from "@/lib/parse";
import {
  appendEntries,
  deleteEntry,
  entryFromParsed,
  getDay,
  getGoal,
  inferMeal,
  lastNDays,
  readAll,
  setGoal,
  todayKey,
  type LogEntry,
  type Meal,
} from "@/lib/storage";
import { findFood, FOODS } from "@/lib/foods";

const MEAL_ORDER: Meal[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};
const MEAL_TIMES: Record<Meal, string> = {
  breakfast: "Morning",
  lunch: "Midday",
  dinner: "Evening",
  snack: "Anytime",
};

function formatQty(q: number): string {
  if (Math.abs(q - 0.25) < 0.01) return "¼";
  if (Math.abs(q - 0.5) < 0.01) return "½";
  if (Math.abs(q - 0.75) < 0.01) return "¾";
  if (Math.abs(q - 0.33) < 0.02) return "⅓";
  if (Math.abs(q - 0.67) < 0.02) return "⅔";
  return Number.isInteger(q) ? `${q}` : q.toFixed(1);
}

function pluralizeUnit(unit: string, qty: number): string {
  if (qty === 1) return unit;
  // Don't pluralize parenthetical units like "serving (4 oz)"
  if (unit.includes("(")) return unit;
  if (unit.endsWith("s")) return unit;
  return unit + "s";
}

export default function Tracker() {
  const speech = useSpeech();
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState<LogEntry[]>([]);
  const [allDays, setAllDays] = useState<Record<string, LogEntry[]>>({});
  const [goal, setGoalState] = useState<number>(2000);
  const [pending, setPending] = useState<ParsedEntry[]>([]);
  const [pendingText, setPendingText] = useState<string>("");
  const [pendingMeal, setPendingMeal] = useState<Meal>(inferMeal());
  const [unmatchedHint, setUnmatchedHint] = useState<string | null>(null);
  const [manualQuery, setManualQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const day = todayKey();

  // Hydrate from storage
  useEffect(() => {
    setToday(getDay(day));
    setAllDays(readAll());
    setGoalState(getGoal());
    setHydrated(true);
  }, [day]);

  const totals = useMemo(() => {
    return today.reduce(
      (acc, e) => {
        acc.calories += e.calories;
        acc.protein += e.protein;
        acc.carbs += e.carbs;
        acc.fat += e.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [today]);

  const remaining = Math.max(0, goal - totals.calories);
  const progress = Math.min(100, (totals.calories / goal) * 100);
  const overGoal = totals.calories > goal;

  // When speech lands, parse it
  useEffect(() => {
    if (!speech.finalText) return;
    const parsed = parseSpeech(speech.finalText);
    setPending(parsed);
    setPendingText(speech.finalText);
    setUnmatchedHint(parsed.length === 0 ? speech.finalText : null);
  }, [speech.finalText]);

  // Auto-scroll the live transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [speech.interim, speech.finalText]);

  const commitPending = useCallback(() => {
    if (pending.length === 0) return;
    const entries = pending.map((p) => entryFromParsed(p, pendingMeal, "voice", pendingText));
    appendEntries(day, entries);
    setToday(getDay(day));
    setAllDays(readAll());
    setPending([]);
    setPendingText("");
    setUnmatchedHint(null);
    speech.reset();
  }, [pending, pendingMeal, pendingText, day, speech]);

  const dismissPending = useCallback(() => {
    setPending([]);
    setPendingText("");
    setUnmatchedHint(null);
    speech.reset();
  }, [speech]);

  const updatePendingQty = (idx: number, qty: number) => {
    setPending((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              quantity: qty,
              calories: Math.round(p.food.caloriesPerUnit * qty),
              protein: Math.round(p.food.macros.protein * qty * 10) / 10,
              carbs: Math.round(p.food.macros.carbs * qty * 10) / 10,
              fat: Math.round(p.food.macros.fat * qty * 10) / 10,
            }
          : p
      )
    );
  };

  const removePending = (idx: number) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManual = (foodId: string) => {
    const food = FOODS.find((f) => f.id === foodId) ?? findFood(foodId);
    if (!food) return;
    const parsed: ParsedEntry = {
      food,
      quantity: 1,
      calories: food.caloriesPerUnit,
      protein: food.macros.protein,
      carbs: food.macros.carbs,
      fat: food.macros.fat,
      matchedText: food.name,
    };
    const entry = entryFromParsed(parsed, inferMeal(), "manual");
    appendEntries(day, [entry]);
    setToday(getDay(day));
    setAllDays(readAll());
    setManualQuery("");
    setManualOpen(false);
  };

  const removeEntry = (id: string) => {
    deleteEntry(day, id);
    setToday(getDay(day));
    setAllDays(readAll());
  };

  const handleMicTap = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      // commit any pending state first so we start fresh
      if (pending.length > 0) commitPending();
      speech.start();
    }
  };

  const groupedByMeal = useMemo(() => {
    const groups: Record<Meal, LogEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const e of today) groups[e.meal].push(e);
    return groups;
  }, [today]);

  const weekData = useMemo(() => {
    const days = lastNDays(7);
    return days.map((k) => {
      const list = allDays[k] ?? [];
      const cal = list.reduce((s, e) => s + e.calories, 0);
      const d = new Date(k + "T00:00:00");
      return {
        key: k,
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
        full: d.toLocaleDateString(undefined, { weekday: "long" }),
        calories: cal,
        isToday: k === day,
      };
    });
  }, [allDays, day]);

  const weekMax = Math.max(goal, ...weekData.map((d) => d.calories), 1);
  const headerDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const suggestions = useMemo(() => suggest(manualQuery, 8), [manualQuery]);

  return (
    <div className="relative min-h-screen w-full grain">
      {/* Background flourish */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,#ffd1bd,transparent)] opacity-70 blur-2xl" />
        <div className="absolute top-[300px] -left-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,#fde6c9,transparent)] opacity-60 blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-10 pb-32 sm:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_8px_24px_-8px_rgba(255,107,53,0.6)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v9" />
                <path d="M8 7c0 4 8 4 8 0" />
                <path d="M5 14c2 5 12 5 14 0" />
              </svg>
            </div>
            <div>
              <p className="font-display text-xl leading-none">Murmur</p>
              <p className="text-xs text-[var(--muted)]">Voice calorie journal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-[var(--muted)]">{headerDate}</span>
            <button
              onClick={() => setShowGoal(true)}
              className="rounded-full border border-[var(--border)] bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm backdrop-blur transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Goal · {goal.toLocaleString()} kcal
            </button>
          </div>
        </header>

        {/* Hero / mic */}
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-[0_24px_60px_-30px_rgba(26,22,17,0.25)] backdrop-blur sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h1 className="font-display text-3xl sm:text-4xl">
                Speak a meal.<br className="hidden sm:block" />
                <span className="text-[var(--accent)]">We do the math.</span>
              </h1>
              {hydrated && (
                <div className="text-right">
                  <div className="font-display text-3xl tabular-nums sm:text-4xl">
                    {totals.calories.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-[var(--muted)]">eaten today</div>
                </div>
              )}
            </div>

            {/* Calorie bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-[var(--muted)]">
                <span>{remaining > 0 ? `${remaining.toLocaleString()} kcal remaining` : `${(totals.calories - goal).toLocaleString()} kcal over goal`}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--border)]/70">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    background: overGoal
                      ? "linear-gradient(90deg,#ff6b35,#dc2626)"
                      : "linear-gradient(90deg,#ff8c5a,#ff6b35)",
                  }}
                />
              </div>
            </div>

            {/* Mic control */}
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:gap-6">
              <button
                onClick={handleMicTap}
                disabled={!speech.supported}
                className="group relative grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[0_18px_40px_-12px_rgba(255,107,53,0.7)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={speech.listening ? "Stop listening" : "Start listening"}
              >
                {speech.listening && <span className="pulse-ring absolute inset-0 rounded-full" aria-hidden />}
                {speech.listening ? (
                  <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor" stroke="none" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                    <path d="M8 21h8" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div
                  ref={transcriptRef}
                  className={`scroll-fade min-h-[5.25rem] max-h-32 overflow-y-auto rounded-2xl border bg-white px-4 py-3 text-sm leading-relaxed text-[var(--foreground)] transition ${
                    speech.listening ? "border-[var(--accent)]" : "border-[var(--border)]"
                  }`}
                >
                  {!speech.supported ? (
                    <p className="text-[var(--muted)]">
                      Voice input isn&apos;t available in this browser. Use the manual add button instead — Murmur still works.
                    </p>
                  ) : speech.listening ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
                        <span className="flex items-end gap-0.5">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className="eq-bar inline-block h-3 w-1 rounded-full bg-[var(--accent)]"
                              style={{ animationDelay: `${i * 0.12}s` }}
                            />
                          ))}
                        </span>
                        Listening…
                      </div>
                      <p className="text-[var(--foreground)]">
                        {speech.finalText && <span>{speech.finalText} </span>}
                        <span className="text-[var(--muted)]">{speech.interim}</span>
                      </p>
                    </div>
                  ) : speech.error ? (
                    <p className="text-[var(--danger)]">{speech.error}</p>
                  ) : pendingText ? (
                    <p className="italic text-[var(--muted)]">&ldquo;{pendingText}&rdquo;</p>
                  ) : (
                    <p className="text-[var(--muted)]">
                      Tap the mic and try: <span className="font-medium text-[var(--foreground)]">&ldquo;I had two eggs and a slice of toast for breakfast&rdquo;</span>
                    </p>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  Works fully in your browser. No audio leaves this device.
                </p>
              </div>
            </div>

            {/* Pending review */}
            {pending.length > 0 && (
              <div className="fade-up mt-6 rounded-2xl border border-dashed border-[var(--accent)]/60 bg-[var(--accent-soft)]/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">Heard you loud and clear</p>
                    <p className="text-xs text-[var(--muted)]">Review {pending.length} item{pending.length === 1 ? "" : "s"} below before saving.</p>
                  </div>
                  <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-0.5 text-xs">
                    {MEAL_ORDER.map((m) => (
                      <button
                        key={m}
                        onClick={() => setPendingMeal(m)}
                        className={`rounded-full px-3 py-1 capitalize transition ${
                          pendingMeal === m ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {pending.map((p, i) => (
                    <li
                      key={`${p.food.id}-${i}`}
                      className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm"
                    >
                      <span className="text-xl" aria-hidden>{p.food.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate font-medium">{p.food.name}</p>
                          <span className="text-xs text-[var(--muted)]">
                            {formatQty(p.quantity)} {pluralizeUnit(p.food.defaultUnit, p.quantity)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {p.calories} kcal · P {p.protein}g · C {p.carbs}g · F {p.fat}g
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updatePendingQty(i, Math.max(0.25, +(p.quantity - 0.5).toFixed(2)))}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          −
                        </button>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updatePendingQty(i, +(p.quantity + 0.5).toFixed(2))}
                          className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          +
                        </button>
                        <button
                          aria-label={`Remove ${p.food.name}`}
                          onClick={() => removePending(i)}
                          className="ml-1 grid h-7 w-7 place-items-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-[var(--danger)]"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={dismissPending}
                    className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    Discard
                  </button>
                  <button
                    onClick={commitPending}
                    className="rounded-full bg-[var(--foreground)] px-5 py-2 text-sm font-medium text-white transition hover:bg-black"
                  >
                    Add {pending.reduce((s, p) => s + p.calories, 0)} kcal
                  </button>
                </div>
              </div>
            )}

            {unmatchedHint && pending.length === 0 && (
              <div className="fade-up mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-4 text-sm">
                <p className="text-[var(--foreground)]">
                  Hmm, didn&apos;t recognise anything in <span className="italic">&ldquo;{unmatchedHint}&rdquo;</span>.
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Try a phrase like &ldquo;a cup of coffee&rdquo; or use{" "}
                  <button onClick={() => setManualOpen(true)} className="font-medium text-[var(--accent)] underline-offset-4 hover:underline">
                    manual entry
                  </button>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Right column: macros + week */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Macros today</h2>
                <button
                  onClick={() => setManualOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add manually
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <MacroTile label="Protein" value={totals.protein} color="#16a34a" />
                <MacroTile label="Carbs" value={totals.carbs} color="#f59e0b" />
                <MacroTile label="Fat" value={totals.fat} color="#8b5cf6" />
              </div>
              <div className="mt-5">
                <MacroRing protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">This week</h2>
                <span className="text-xs text-[var(--muted)]">Goal {goal.toLocaleString()} kcal</span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {weekData.map((d) => {
                  const heightPct = (d.calories / weekMax) * 100;
                  const goalPct = (goal / weekMax) * 100;
                  return (
                    <div key={d.key} className="flex flex-col items-center gap-1.5">
                      <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[var(--border)]/60">
                        {/* goal line */}
                        <div
                          className="absolute left-0 right-0 border-t border-dashed border-[var(--accent)]/50"
                          style={{ bottom: `${goalPct}%` }}
                        />
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-xl"
                          style={{
                            height: `${heightPct}%`,
                            background: d.isToday
                              ? "linear-gradient(180deg,#ff8c5a,#ff6b35)"
                              : "linear-gradient(180deg,#cdbfaa,#a99a82)",
                          }}
                          title={`${d.full}: ${d.calories} kcal`}
                        />
                      </div>
                      <span className={`text-[10px] uppercase tracking-wide ${d.isToday ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"}`}>
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Today log */}
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">Today&apos;s journal</h2>
            <span className="text-sm text-[var(--muted)]">
              {today.length} {today.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {today.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[var(--border)] bg-white/40 p-10 text-center">
              <p className="font-display text-xl">Your journal is empty.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Hold the mic and tell Murmur what you ate. We&apos;ll figure out the calories and macros — feel free to mention quantities like
                {" "}<span className="italic">&ldquo;two slices&rdquo;</span> or <span className="italic">&ldquo;a cup of&rdquo;</span>.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {MEAL_ORDER.map((m) => (
                <MealColumn
                  key={m}
                  meal={m}
                  entries={groupedByMeal[m]}
                  onRemove={removeEntry}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)]/60 pt-6 text-xs text-[var(--muted)]">
          <p>Built with care. Estimates are approximate — your body, your call.</p>
          <p>Murmur · {new Date().getFullYear()}</p>
        </footer>
      </div>

      {/* Manual entry sheet */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => setManualOpen(false)}>
          <div
            className="fade-up w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Add an item</h3>
              <button onClick={() => setManualOpen(false)} aria-label="Close" className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <input
              autoFocus
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search foods…"
              className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
            />
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {(manualQuery ? suggestions : FOODS.slice(0, 10)).map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => addManual(f.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--accent-soft)]"
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{f.name}</span>
                      <span className="text-xs text-[var(--muted)]">{f.caloriesPerUnit} kcal · per {f.defaultUnit}</span>
                    </span>
                    <span className="text-xs font-medium text-[var(--accent)]">Add</span>
                  </button>
                </li>
              ))}
              {manualQuery && suggestions.length === 0 && (
                <li className="px-3 py-4 text-sm text-[var(--muted)]">No matches.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Goal sheet */}
      {showGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={() => setShowGoal(false)}>
          <div
            className="fade-up w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl">Daily calorie goal</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Set the target Murmur measures your day against.</p>
            <div className="mt-4 flex items-center gap-2">
              {[1500, 1800, 2000, 2200, 2500, 3000].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setGoal(n);
                    setGoalState(n);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    goal === n ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={goal}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n) && n > 0) {
                  setGoal(n);
                  setGoalState(n);
                }
              }}
              className="mt-4 w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-base outline-none focus:border-[var(--accent)]"
              min={500}
              max={6000}
            />
            <button
              onClick={() => setShowGoal(false)}
              className="mt-4 w-full rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-3">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl tabular-nums" style={{ color }}>
          {Math.round(value)}
        </span>
        <span className="text-xs text-[var(--muted)]">g</span>
      </div>
    </div>
  );
}

function MacroRing({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const pCal = protein * 4;
  const cCal = carbs * 4;
  const fCal = fat * 9;
  const total = pCal + cCal + fCal;
  if (total === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Macro split appears once you log something.
      </p>
    );
  }
  const pPct = (pCal / total) * 100;
  const cPct = (cCal / total) * 100;
  const fPct = (fCal / total) * 100;
  const grad = `conic-gradient(#16a34a 0 ${pPct}%, #f59e0b ${pPct}% ${pPct + cPct}%, #8b5cf6 ${pPct + cPct}% 100%)`;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: grad }}>
        <div className="absolute inset-2 grid place-items-center rounded-full bg-white">
          <span className="font-display text-lg">{Math.round(total)}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 text-sm">
        <LegendRow color="#16a34a" label="Protein" pct={pPct} />
        <LegendRow color="#f59e0b" label="Carbs" pct={cPct} />
        <LegendRow color="#8b5cf6" label="Fat" pct={fPct} />
      </ul>
    </div>
  );
}

function LegendRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[var(--muted)]">{label}</span>
      </span>
      <span className="tabular-nums font-medium">{Math.round(pct)}%</span>
    </li>
  );
}

function MealColumn({
  meal,
  entries,
  onRemove,
}: {
  meal: Meal;
  entries: LogEntry[];
  onRemove: (id: string) => void;
}) {
  const cals = entries.reduce((s, e) => s + e.calories, 0);
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 backdrop-blur">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="font-display text-lg">{MEAL_LABELS[meal]}</h3>
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{MEAL_TIMES[meal]}</p>
        </div>
        <span className="text-sm tabular-nums font-medium">{cals} kcal</span>
      </div>
      <ul className="mt-3 space-y-2">
        {entries.length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--muted)]">
            Nothing logged
          </li>
        )}
        {entries.map((e) => (
          <li key={e.id} className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-[var(--accent-soft)]/40">
            <span className="text-lg" aria-hidden>{e.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.foodName}</p>
              <p className="truncate text-[11px] text-[var(--muted)]">
                {formatQty(e.quantity)} {pluralizeUnit(e.unit, e.quantity)} · {e.calories} kcal
              </p>
            </div>
            <button
              aria-label={`Remove ${e.foodName}`}
              onClick={() => onRemove(e.id)}
              className="grid h-7 w-7 place-items-center rounded-full text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-[var(--danger)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
