import { useState, useEffect } from "react";
import type { Challenge } from "./types";
import { generateChallenge } from "./api";
import { loadStore, loadTodayState, saveStore, todayKey, yesterdayKey } from "./storage";
import { CodeBlock, CodeEditor, Badge, LoadingSkeleton } from "./components";
import { runCode } from "./runner";
import type { RunResult } from "./runner";

export default function App() {
  const stored = loadStore();
  const todayState = loadTodayState();

  const [challenge, setChallenge] = useState<Challenge | null>(todayState?.challenge ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(todayState?.hintShown ?? false);
  const [solved, setSolved] = useState(todayState?.solved ?? false);
  const [fixShown, setFixShown] = useState(false);
  const [userCode, setUserCode] = useState<string>(todayState?.challenge?.buggyCode ?? "");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [expectedLogs, setExpectedLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(stored.streak ?? 0);
  const [lastKey, setLastKey] = useState<string | null>(stored.lastKey ?? null);
  const [total, setTotal] = useState(stored.total ?? 0);

  useEffect(() => {
    if (!challenge && !loading) {
      generate();
    }
  }, []);

  async function generate(force = false) {
    setLoading(true);
    setError(null);
    if (force) {
      setHintShown(false);
      setSolved(false);
      setFixShown(false);
    }

    try {
      const next = await generateChallenge();
      setChallenge(next);
      setUserCode(next.buggyCode);
      setRunResult(null);
      setIsCorrect(null);
      setExpectedLogs([]);
      saveStore({ [todayKey()]: { challenge: next, hintShown: false, solved: false } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Couldn't generate a challenge: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  function showHint() {
    setHintShown(true);
    saveStore({ [todayKey()]: { challenge: challenge!, hintShown: true, solved } });
  }

  function markSolved() {
    if (solved) { setFixShown(true); return; }
    setSolved(true);
    setFixShown(true);

    const yKey = yesterdayKey();
    const newStreak = lastKey === yKey || lastKey === todayKey() ? streak + (lastKey === todayKey() ? 0 : 1) : 1;
    const newTotal = total + 1;

    setStreak(newStreak);
    setLastKey(todayKey());
    setTotal(newTotal);

    saveStore({
      [todayKey()]: { challenge: challenge!, hintShown, solved: true },
      streak: newStreak,
      lastKey: todayKey(),
      total: newTotal,
    });
  }

  async function handleRun() {
    setIsRunning(true);
    setRunResult(null);
    setIsCorrect(null);
    setExpectedLogs([]);

    const userResult = await runCode(userCode);
    setRunResult(userResult);

    const expected = challenge!.expectedOutput;
    if (expected && !userResult.error) {
      const expectedLines = [expected];
      setExpectedLogs(expectedLines);
      setIsCorrect(userResult.logs.join('\n').trim() === expected.trim());
    }

    setIsRunning(false);
  }

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0C0C11", color: "#DDDDE8", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.35} 50%{opacity:.8} }
        button:hover { opacity: .82; transition: opacity .15s; }
      `}</style>

      <nav style={{ borderBottom: "1px solid #18181F", padding: "13px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0C0C11", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 16 }}>🐛</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: "#EEEEF4" }}>
            debug<span style={{ color: "#7878FF" }}>daily</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#505060" }}>
          <span>🔥 <strong style={{ color: "#DDDDE8" }}>{streak}</strong></span>
          <span>✅ <strong style={{ color: "#DDDDE8" }}>{total}</strong> solved</span>
        </div>
      </nav>

      {/* full-width two-column layout below the nav */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 48px)" }}>

        {/* ── Left column: problem description + buggy code ── */}
        <div style={{
          position: "sticky",
          top: 48,
          height: "calc(100vh - 48px)",
          overflowY: "auto",
          borderRight: "1px solid #18181F",
          padding: "28px 28px 48px 32px",
        }}>
          <div style={{ fontSize: 11, color: "#383848", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>
            {dateLabel}
          </div>

          {loading && <LoadingSkeleton />}

          {!loading && error && (
            <div style={{ background: "#180E12", border: "1px solid #3A1825", borderRadius: 10, padding: "20px 24px", color: "#B06070" }}>
              <div style={{ marginBottom: 12 }}>{error}</div>
              <button onClick={() => generate(true)} style={{ background: "transparent", border: "1px solid #3A1825", color: "#B06070", borderRadius: 7, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && challenge && (
            <>
              <div style={{ background: "#12121A", border: "1px solid #20202C", borderRadius: 12, padding: "20px 22px", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px", color: "#EEEEF6", lineHeight: 1.3 }}>
                    {challenge.title}
                  </h1>
                  {solved && (
                    <span style={{ background: "#0D2018", border: "1px solid #1E4A30", color: "#4EC9B0", borderRadius: 6, padding: "4px 11px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                      ✓ Solved
                    </span>
                  )}
                </div>
                <p style={{ margin: "0 0 6px", lineHeight: 1.65, fontSize: 14, color: "#80809A" }}>{challenge.scenario}</p>
                {challenge.task && (
                  <p style={{ margin: "10px 0 12px", color: "#A0A0C0", fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
                    👉 {challenge.task}
                  </p>
                )}
                <div>{challenge.concepts.map((c) => <Badge key={c} label={c} />)}</div>
              </div>

              <CodeBlock code={challenge.buggyCode} label="The code" />
            </>
          )}
        </div>

        {/* ── Right column: editor + output + actions ── */}
        <div style={{ padding: "28px 32px 48px 28px" }}>
          {!loading && !error && challenge && (
            <>
              <CodeEditor
                code={userCode}
                onChange={(v) => { setUserCode(v); setRunResult(null); setIsCorrect(null); }}
                onRun={handleRun}
                running={isRunning}
                result={runResult}
                correct={isCorrect}
                expectedLogs={expectedLogs}
              />

              {hintShown && (
                <div style={{ background: "#15140A", border: "1px solid #32300E", borderRadius: 8, padding: "13px 17px", marginBottom: 16, fontSize: 14, color: "#C0B850", lineHeight: 1.65 }}>
                  💡 {challenge.hint}
                </div>
              )}

              {fixShown && <CodeBlock code={challenge.fix} label="✓ The fix" accent="#4EC9B0" />}

              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 4 }}>
                {!hintShown && !solved && (
                  <button onClick={showHint} style={{ background: "transparent", border: "1px solid #25253A", color: "#60608A", borderRadius: 8, padding: "10px 17px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    💡 Hint
                  </button>
                )}
                {!solved && (
                  <button onClick={markSolved} style={{ background: "#7878FF", border: "none", color: "#fff", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                    I found it — show fix
                  </button>
                )}
                {solved && !fixShown && (
                  <button onClick={() => setFixShown(true)} style={{ background: "transparent", border: "1px solid #25253A", color: "#60608A", borderRadius: 8, padding: "10px 17px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Show fix
                  </button>
                )}
                <button onClick={() => generate(true)} style={{ background: "transparent", border: "1px solid #1E1E2A", color: "#404050", borderRadius: 8, padding: "10px 17px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>
                  ↻ New challenge
                </button>
              </div>

              {solved && streak > 1 && (
                <div style={{ textAlign: "center", color: "#383848", fontSize: 13, marginTop: 22 }}>
                  {streak} days in a row. See you tomorrow.
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
