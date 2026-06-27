import type { Challenge } from "./types";
import { CHALLENGE_TYPES, SYSTEM_PROMPT } from "./prompts";

const API_URL = "/api/anthropic/v1/messages";
const MODEL = "claude-sonnet-4-6";

export async function generateChallenge(): Promise<Challenge> {
  const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Challenge type: ${type}` }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const raw: string = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  const clean = raw.replace(/```json|```/g, "").trim();
  const challenge = JSON.parse(clean) as Challenge;

  // Claude occasionally HTML-encodes quotes inside JSON strings; decode them.
  challenge.buggyCode = decodeEntities(challenge.buggyCode);
  challenge.fix = decodeEntities(challenge.fix);

  return challenge;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
