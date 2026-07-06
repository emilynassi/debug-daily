import { useState, useEffect, type FormEvent } from "react";

const EXPECTED = import.meta.env.VITE_APP_PASSWORD_HASH as string | undefined;
const SESSION_KEY = "dd_auth";
// app-specific prefix so the stored hash isn't a direct SHA-256 of the password
const SALT = "debug-daily:";

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // No hash configured — skip gate entirely (dev convenience)
    if (!EXPECTED) {
      setAuthed(true);
      setChecking(false);
      return;
    }
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored === EXPECTED) setAuthed(true);
    setChecking(false);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const hash = await sha256(SALT + input);
    if (hash === EXPECTED) {
      sessionStorage.setItem(SESSION_KEY, EXPECTED);
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (checking) return null;
  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1117",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 300,
        }}
      >
        <h2 style={{ margin: 0, color: "#e2e8f0", fontFamily: "monospace" }}>
          debug-daily
        </h2>
        <input
          type="password"
          placeholder="Password"
          value={input}
          autoFocus
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: error ? "1px solid #f87171" : "1px solid #374151",
            background: "#1e2130",
            color: "#e2e8f0",
            fontSize: 14,
            fontFamily: "monospace",
            outline: "none",
          }}
        />
        {error && (
          <span style={{ color: "#f87171", fontSize: 13, fontFamily: "monospace" }}>
            Incorrect password
          </span>
        )}
        <button
          type="submit"
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontSize: 14,
            fontFamily: "monospace",
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}
