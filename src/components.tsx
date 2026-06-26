import { useState, useRef, useEffect } from "react";
import { highlight } from "./highlight";
import type { RunResult } from "./runner";

// ─── CodeBlock ────────────────────────────────────────────────────────────────

interface CodeBlockProps {
  code: string;
  label?: string;
  accent?: string;
}

export function CodeBlock({ code, label, accent }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            fontWeight: 600,
            color: accent ?? "#444",
            marginBottom: 7,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: "relative",
          background: "#111118",
          borderRadius: 10,
          border: `1px solid ${accent ? "#1E3A28" : "#22222E"}`,
        }}
      >
        <button
          onClick={copy}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "transparent",
            border: "1px solid #2E2E3E",
            color: copied ? "#4EC9B0" : "#444",
            borderRadius: 5,
            fontSize: 11,
            padding: "2px 9px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? "✓" : "copy"}
        </button>
        <pre
          style={{
            margin: 0,
            padding: 18,
            overflowX: "auto",
            fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
            fontSize: 13,
            lineHeight: 1.75,
            color: "#D4D4D4",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          dangerouslySetInnerHTML={{ __html: highlight(code) }}
        />
      </div>
    </div>
  );
}

// ─── CodeEditor ───────────────────────────────────────────────────────────────

interface CodeEditorProps {
  code: string;
  onChange: (v: string) => void;
  onRun: () => void;
  running: boolean;
  result: RunResult | null;
  correct: boolean | null;
  expectedLogs: string[];
}

export function CodeEditor({ code, onChange, onRun, running, result, correct, expectedLogs }: CodeEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow height without jumping the page scroll position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scrollY = window.scrollY;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    window.scrollTo(0, scrollY);
  }, [code]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const s = el.selectionStart;
      const next = el.value.slice(0, s) + "  " + el.value.slice(el.selectionEnd);
      onChange(next);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2; });
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, color: "#444" }}>
          Your fix
        </div>
        <button
          onClick={onRun}
          disabled={running}
          style={{
            background: running ? "#2A2A3A" : "#7878FF",
            border: "none",
            color: running ? "#505070" : "#fff",
            borderRadius: 7,
            padding: "5px 16px",
            fontSize: 12,
            fontWeight: 600,
            cursor: running ? "default" : "pointer",
            fontFamily: "inherit",
            letterSpacing: 0.3,
          }}
        >
          {running ? "Running…" : "▶ Run"}
        </button>
      </div>
      <textarea
        ref={ref}
        value={code}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          display: "block",
          width: "100%",
          minHeight: 160,
          background: "#0E0E16",
          border: "1px solid #22222E",
          borderRadius: 10,
          color: "#D4D4D4",
          fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
          fontSize: 13,
          lineHeight: 1.75,
          padding: "14px 16px",
          resize: "none",
          boxSizing: "border-box",
          outline: "none",
          overflowY: "hidden",
        }}
      />
      {result && (
        <div style={{
          marginTop: 8,
          background: "#0A0A12",
          border: `1px solid ${correct === true ? "#1E4A30" : correct === false ? "#3A1825" : result.error ? "#3A1825" : "#1A2A1A"}`,
          borderRadius: 8,
          padding: "12px 16px",
          fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
          fontSize: 12,
          lineHeight: 1.7,
        }}>
          {correct === true && (
            <div style={{ color: "#4EC9B0", fontWeight: 600, marginBottom: result.logs.length ? 8 : 0 }}>
              ✓ Output matches — looks correct!
            </div>
          )}
          {correct === false && !result.error && (
            <div style={{ color: "#B06070", fontWeight: 600, marginBottom: result.logs.length ? 8 : 0 }}>
              ✕ Output doesn't match the expected fix yet
            </div>
          )}
          {result.logs.length === 0 && !result.error && correct === null && (
            <span style={{ color: "#404050" }}>No output</span>
          )}
          {result.logs.map((line, i) => (
            <div key={i} style={{ color: "#A0CFA0" }}>{line}</div>
          ))}
          {result.error && (
            <div style={{ color: "#B06070", marginTop: result.logs.length ? 8 : 0 }}>
              ✕ {result.error}
            </div>
          )}
          {correct === false && expectedLogs.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1E1E2A" }}>
              <div style={{ color: "#505060", marginBottom: 4, fontSize: 11, letterSpacing: 0.5 }}>EXPECTED</div>
              {expectedLogs.map((line, i) => (
                <div key={i} style={{ color: "#606070" }}>{line}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        background: "#1A1A2A",
        border: "1px solid #2E2E44",
        borderRadius: 5,
        fontSize: 11,
        color: "#7070B0",
        marginRight: 6,
        marginBottom: 5,
      }}
    >
      {label}
    </span>
  );
}

// ─── Skeleton / shimmer ───────────────────────────────────────────────────────

function Shimmer({ h = 14, w = "100%", mb = 12 }: { h?: number; w?: string | number; mb?: number }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        background: "#1A1A24",
        borderRadius: 5,
        marginBottom: mb,
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div>
      <Shimmer h={28} w={280} mb={16} />
      <Shimmer h={14} w="90%" mb={8} />
      <Shimmer h={14} w="70%" mb={24} />
      <div
        style={{
          background: "#111118",
          borderRadius: 10,
          border: "1px solid #1E1E28",
          padding: 18,
        }}
      >
        {[100, 85, 95, 70, 88, 60].map((w, i) => (
          <Shimmer key={i} h={13} w={`${w}%`} mb={10} />
        ))}
      </div>
    </div>
  );
}
