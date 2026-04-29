import { FOODS, findFood, type Food } from "./foods";

export type ParsedEntry = {
  food: Food;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  matchedText: string;
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  half: 0.5,
  quarter: 0.25,
  couple: 2,
  few: 3,
  several: 4,
  dozen: 12,
};

const FRACTIONS: Record<string, number> = {
  "1/2": 0.5,
  "1/3": 0.33,
  "2/3": 0.67,
  "1/4": 0.25,
  "3/4": 0.75,
};

// Words to discard so phrasing like "I had two eggs" works.
const FILLERS = new Set([
  "i", "had", "have", "ate", "eat", "eaten", "drank", "drink", "drunk",
  "just", "just had", "for", "breakfast", "lunch", "dinner", "snack",
  "today", "this", "morning", "afternoon", "evening", "night",
  "and", "with", "plus", "also", "the", "some", "of", "my", "a", "an",
  "then", "after", "before", "was", "were", "is", "got",
]);

function splitClauses(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.!?]/g, ",")
    .split(/,| and | with | plus | also |\bthen\b|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractQuantity(words: string[]): { quantity: number; rest: string[] } {
  if (words.length === 0) return { quantity: 1, rest: words };
  const first = words[0];
  const second = words[1];
  if (/^\d+(\.\d+)?$/.test(first)) {
    return { quantity: parseFloat(first), rest: words.slice(1) };
  }
  if (FRACTIONS[first]) {
    return { quantity: FRACTIONS[first], rest: words.slice(1) };
  }
  if (NUMBER_WORDS[first] !== undefined) {
    if (first === "a" && second && NUMBER_WORDS[second] !== undefined) {
      return { quantity: NUMBER_WORDS[second], rest: words.slice(2) };
    }
    if (first === "half" && second === "a") {
      return { quantity: 0.5, rest: words.slice(2) };
    }
    return { quantity: NUMBER_WORDS[first], rest: words.slice(1) };
  }
  return { quantity: 1, rest: words };
}

const UNIT_HINTS = new Set([
  "cup", "cups", "slice", "slices", "piece", "pieces", "scoop", "scoops",
  "bowl", "bowls", "glass", "glasses", "can", "cans", "bottle", "bottles",
  "bar", "bars", "handful", "handfuls", "tablespoon", "tablespoons", "tbsp",
  "teaspoon", "teaspoons", "tsp", "ounce", "ounces", "oz",
  "gram", "grams", "g", "serving", "servings",
  "small", "medium", "large", "big", "little",
]);

function stripUnitHints(words: string[]): string[] {
  let i = 0;
  while (i < words.length && UNIT_HINTS.has(words[i])) i++;
  if (words[i] === "of") i++;
  return words.slice(i);
}

function stripFillers(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !FILLERS.has(w))
    .join(" ")
    .trim();
}

function tryMatch(clause: string): ParsedEntry | undefined {
  const cleaned = stripFillers(clause).trim();
  if (!cleaned) return undefined;
  const tokens = cleaned.split(/\s+/);
  const { quantity, rest } = extractQuantity(tokens);
  const remaining = stripUnitHints(rest);
  const phrase = remaining.join(" ").trim();
  let food = findFood(phrase);
  if (!food) food = findFood(clause);
  if (!food) return undefined;
  const qty = quantity > 0 ? quantity : 1;
  return {
    food,
    quantity: qty,
    calories: Math.round(food.caloriesPerUnit * qty),
    protein: Math.round(food.macros.protein * qty * 10) / 10,
    carbs: Math.round(food.macros.carbs * qty * 10) / 10,
    fat: Math.round(food.macros.fat * qty * 10) / 10,
    matchedText: clause.trim(),
  };
}

export function parseSpeech(text: string): ParsedEntry[] {
  if (!text.trim()) return [];
  const clauses = splitClauses(text);
  const out: ParsedEntry[] = [];
  for (const clause of clauses) {
    const m = tryMatch(clause);
    if (m) out.push(m);
  }
  const merged = new Map<string, ParsedEntry>();
  for (const e of out) {
    const k = e.food.id;
    if (merged.has(k)) {
      const prev = merged.get(k)!;
      prev.quantity += e.quantity;
      prev.calories += e.calories;
      prev.protein = Math.round((prev.protein + e.protein) * 10) / 10;
      prev.carbs = Math.round((prev.carbs + e.carbs) * 10) / 10;
      prev.fat = Math.round((prev.fat + e.fat) * 10) / 10;
    } else {
      merged.set(k, { ...e });
    }
  }
  return Array.from(merged.values());
}

export function suggest(query: string, limit = 6): Food[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const scored = FOODS.map((f) => {
    const direct = f.aliases.some((a) => a.startsWith(q)) ? 100 : 0;
    const contains = f.aliases.some((a) => a.includes(q)) ? 50 : 0;
    const nameMatch = f.name.toLowerCase().includes(q) ? 30 : 0;
    return { f, score: direct + contains + nameMatch };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.f);
  return scored;
}
