import * as ts from "typescript";

export interface RunResult {
  logs: string[];
  error: string | null;
}

function transpile(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: false,
    },
    reportDiagnostics: false,
  });
  return result.outputText;
}

export function runCode(code: string): Promise<RunResult> {
  let js: string;
  try {
    js = transpile(code);
  } catch (e) {
    return Promise.resolve({ logs: [], error: (e as Error).message });
  }

  return new Promise((resolve) => {
    const logs: string[] = [];
    let settled = false;

    // Fresh worker per run so challenge code can't leak state between runs.
    // The worker bundles the real `vue` package for Vue challenges.
    const worker = new Worker(new URL("./runnerWorker.ts", import.meta.url), { type: "module" });

    function finish(result: RunResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    }

    const timer = setTimeout(() => {
      finish({ logs, error: "Timed out after 5s" });
    }, 5000);

    worker.onmessage = (e: MessageEvent) => {
      const { type, text, message } = e.data as { type: string; text?: string; message?: string };
      if (type === "log" && text !== undefined) {
        logs.push(text);
      } else if (type === "done") {
        finish({ logs, error: null });
      } else if (type === "error") {
        finish({ logs, error: message ?? "Unknown error" });
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      finish({ logs, error: e.message });
    };

    worker.postMessage({ js });
  });
}
