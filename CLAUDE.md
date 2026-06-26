# debug-daily

A daily JS/TypeScript debugging practice app. Opens in the browser, calls the Anthropic API to generate a fresh challenge each morning, and caches it for the day so refreshes don't burn a new one.

## What it does

- Generates a new debugging or TypeScript type challenge every day via `claude-sonnet-4-6`
- Challenge types rotate across ~20 real-world bug patterns (stale closures, async misuse, TS type gaps, array mutation, etc.)
- Hint system, fix reveal, streak tracking — all persisted in `localStorage`
- "↻ New challenge" button generates a fresh one on demand

## Stack

- **Vite** + **React 18** + **TypeScript**
- No UI library, no router — intentionally minimal
- Styling is all inline (easy to rip out and replace)

## Project structure

```
src/
  types.ts       — Challenge, DayState, StoredData interfaces
  prompts.ts     — CHALLENGE_TYPES array + SYSTEM_PROMPT for the API
  api.ts         — generateChallenge() — single Anthropic API call
  storage.ts     — localStorage read/write helpers
  highlight.ts   — minimal JS/TS syntax highlighter (no deps)
  components.tsx — CodeBlock, Badge, LoadingSkeleton
  App.tsx        — main component, all state lives here
  main.tsx       — Vite entry point
```

## Running locally

```bash
cp .env.example .env
# Add your Anthropic API key to .env
npm install
npm run dev
```

## Environment

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

The key is read in `src/api.ts`. If the env var is absent (e.g. running inside a Claude.ai artifact), the API call goes through without an explicit key — the artifact proxy handles auth.

## Good next directions

- **Difficulty selector** — easy / medium / hard passed into the prompt
- **History view** — list of past challenges with solved status
- **Category filter** — let the user pick "TypeScript only" or "async bugs only"
- **Spaced repetition** — surface challenge types the user gets wrong more often
- **Export** — copy today's challenge as a markdown snippet for a notes app
- **PWA** — add a manifest + service worker so it installs as a home screen app
- **Notion integration** — log solved challenges back to a Notion database

## Notes for Claude Code

- `prompts.ts` is the best place to tune challenge quality — edit `SYSTEM_PROMPT` or add/remove entries in `CHALLENGE_TYPES`
- `storage.ts` uses a flat key-value shape; if you add history features, consider migrating to a more structured schema
- The inline styles in `App.tsx` and `components.tsx` are intentional (no CSS modules needed at this scale) but feel free to move to Tailwind or CSS modules
