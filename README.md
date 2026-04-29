# Murmur — Voice-Activated Calorie Tracker

Speak your meals. Murmur turns natural-language phrases like
*"I had two eggs and a slice of toast"* into a calorie & macro log,
all in your browser.

## Features

- **Voice input** via the Web Speech API — no audio leaves the device.
- **Smart parser** that handles quantities ("two", "a couple", "half a"),
  unit hints ("slice of", "cup of"), and casual phrasing.
- **130+ food database** with calories and macros (protein/carbs/fat).
- **Daily journal** grouped by meal (breakfast / lunch / dinner / snack).
- **Manual fallback** with fuzzy search — works in browsers without speech support.
- **Goal & weekly view** with a 7-day calorie chart.
- Persists locally with `localStorage`. No accounts, no servers.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4

## Run locally

```bash
npm install
npm run dev
```

## Deploy

The app is fully static and works on any modern host. Built and deployed on Vercel.
