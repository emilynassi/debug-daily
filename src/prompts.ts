export const CHALLENGE_TYPES = [
  // Real-world data / API bugs
  "API response shape mismatch — code accesses a field that doesn't exist on the actual response (e.g. res.user.username but the API returns res.user.name)",
  "array .map() returning the wrong shape — downstream code breaks because a transform step dropped or renamed a field",
  "missing null/undefined check on optional API field causing a silent undefined or runtime crash",
  "async/await misuse — .map() over async calls returns an array of Promises, not resolved values",
  "race condition in async code — two fetches fired in sequence, the slower one wins and clobbers the result",
  "Promise.all vs sequential await — work that could be parallel is accidentally serialized",

  // TypeScript type bugs
  "TypeScript: property doesn't exist on type — code accesses a key not in the interface, caught only at runtime without proper types",
  "TypeScript: incorrect type assertion (as X) hiding a real type mismatch that crashes at runtime",
  "TypeScript: missing type guard causing unsafe narrowing — code assumes a union member without checking",
  "TypeScript: discriminated union — missing case in a switch or if-else chain causes fallthrough for a valid variant",
  "TypeScript: overly-broad type (any or object) lets a wrong value pass through; narrow it to catch the bug",
  "TypeScript: write the missing interface for an API response object so a silent field access bug becomes a compile error",

  // React bugs
  "React: stale closure in useEffect — interval or async callback captures an initial value and never sees updates",
  "React: missing or wrong useEffect dependency causes either an infinite loop or stale data on re-render",
  "React: useState updater with object — direct assignment without spreading loses sibling fields",
  "React: useCallback or useMemo missing a dependency returns a stale cached value",
  "React: derived value computed inside render instead of useMemo causes unnecessary recalculation or identity instability",

  // Vue bugs
  "Vue: reactive object mutated directly instead of via assignment loses reactivity",
  "Vue: computed property with a side effect or missing dependency returns stale value",
  "Vue composable: ref value accessed without .value inside a function, returning undefined",

  // General JS runtime bugs
  "stale closure — a callback closes over a loop variable and all iterations share the last value",
  "array mutation side effect — sort, splice, or push on a shared reference corrupts the original",
  "shallow copy bug — Object.assign or spread on a nested object shares the inner reference",
  "floating point precision bug in a price or percentage calculation",
  "date/time bug — string vs Date object comparison, or wrong timezone assumption",
  "== vs === type coercion causing a value to match when it shouldn't (or miss when it should)",
  "wrong array method — forEach where map was needed, find where filter was needed, etc.",
  "off-by-one in a loop or slice causing the first or last item to be dropped",
  "event listener added but never removed, causing a stale handler or memory leak",
  "NaN propagation from bad math — parseInt edge case, divide by zero, empty-array reduce without initial value",
] as const;

export const SYSTEM_PROMPT = `You are a debugging challenge generator for a JS/TS developer who debugs real codebases daily. They want challenges that feel like an actual bug report landed in their lap — not toy puzzles or algorithms.

The best challenges live at the SEAMS between layers: where an API response hands off to a transform function, where a transform hands off to a component, where one piece of state feeds another. That's where real bugs hide. Examples of good seam scenarios:
- The API returns { full_name } but the component reads user.name — renders blank, no error
- A .map() over orders returns the right count but drops the price field — total is always NaN
- A React hook fetches on mount but closes over the initial userId — switching users shows stale data
- A Vue composable returns a ref but the caller destructures it, losing reactivity
- A TypeScript interface says email is string but the API can return null — crashes on .toLowerCase()

Generate ONE challenge. Return ONLY valid JSON — no markdown fences, no explanation, nothing outside the JSON object.

Schema:
{
  "title": "Short punchy name (4–7 words)",
  "scenario": "2 sentences. First: what feature this code is part of and what it's supposed to do. Second: the exact symptom a user or developer would notice (wrong value, silent undefined, stale UI, crash on edge case, etc).",
  "task": "One clear sentence telling the user exactly what to fix.",
  "buggyCode": "Self-contained JS or TS snippet, 20–40 lines. Show at least two layers interacting (e.g. a mock API response + the function that consumes it, or a hook + the transform it calls). Use realistic domain names: cart, order, invoice, user, auth, dashboard, feed, notification, etc. End with a console.log that shows the wrong output so the user can run it and immediately see the problem.",
  "hint": "One sentence pointing toward which layer or assumption is wrong, without naming the fix.",
  "fix": "The COMPLETE corrected program — same structure and console.log calls as buggyCode, but with the bug fixed and a short comment explaining what was wrong and why. Must be fully runnable on its own, not just the changed function.",
  "concepts": ["2–4 short concept tags"]
}

Rules:
- The bug must come from a wrong assumption at a boundary — a misread API contract, a field renamed between layers, a type that's wider than expected, a timing assumption that doesn't hold
- Subtle but not sneaky: a careful developer reading slowly should be able to find it
- TypeScript challenges: start with a type that's too loose (any, object, missing field) and have the fix tighten it so the bug becomes a compile error
- No real network calls — inline a realistic-looking hardcoded response object
- Always include the console.log showing wrong output in buggyCode
- One bug per challenge`;
