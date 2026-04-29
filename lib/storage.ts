"use client";

import type { ParsedEntry } from "./parse";

export type LogEntry = {
  id: string;
  timestamp: number;
  foodId: string;
  foodName: string;
  emoji: string;
  unit: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: Meal;
  source: "voice" | "manual";
  rawText?: string;
};

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";
export type DayKey = string; // YYYY-MM-DD

const KEY = "murmur:log:v1";
const GOAL_KEY = "murmur:goal:v1";

export function todayKey(d = new Date()): DayKey {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function readAll(): Record<DayKey, LogEntry[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeAll(data: Record<DayKey, LogEntry[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function getDay(day: DayKey): LogEntry[] {
  const all = readAll();
  return all[day] ?? [];
}

export function appendEntries(day: DayKey, entries: LogEntry[]) {
  const all = readAll();
  all[day] = [...(all[day] ?? []), ...entries];
  writeAll(all);
  return all[day];
}

export function deleteEntry(day: DayKey, id: string) {
  const all = readAll();
  all[day] = (all[day] ?? []).filter((e) => e.id !== id);
  writeAll(all);
  return all[day];
}

export function clearDay(day: DayKey) {
  const all = readAll();
  delete all[day];
  writeAll(all);
}

export function entryFromParsed(p: ParsedEntry, meal: Meal, source: "voice" | "manual", rawText?: string): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    foodId: p.food.id,
    foodName: p.food.name,
    emoji: p.food.emoji,
    unit: p.food.defaultUnit,
    quantity: p.quantity,
    calories: p.calories,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    meal,
    source,
    rawText,
  };
}

export function inferMeal(d = new Date()): Meal {
  const h = d.getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function getGoal(): number {
  if (typeof window === "undefined") return 2000;
  const raw = localStorage.getItem(GOAL_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

export function setGoal(n: number) {
  if (typeof window === "undefined") return;
  if (Number.isFinite(n) && n > 0) localStorage.setItem(GOAL_KEY, String(Math.round(n)));
}

export function lastNDays(n: number): DayKey[] {
  const out: DayKey[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}
