import * as Vue from "vue";

// Real modules exposed to challenge code through the require() shim.
// `default` points back at the namespace so both `import { ref } from 'vue'`
// and `import Vue from 'vue'` resolve after CommonJS transpilation.
const modules: Record<string, unknown> = {
  vue: { ...Vue, default: Vue },
};

function requireShim(name: string): unknown {
  return modules[name] ?? {};
}

function format(value: unknown): string {
  try {
    return typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : String(value);
  } catch {
    return String(value);
  }
}

const log = (...args: unknown[]) => {
  self.postMessage({ type: "log", text: args.map(format).join(" ") });
};
const consoleShim = { log, warn: log, info: log };

self.onmessage = (e: MessageEvent<{ js: string }>) => {
  const exports = {};
  const module = { exports };

  Promise.resolve()
    .then(() => {
      const run = new Function(
        "require", "exports", "module", "console",
        `return (async function () {\n${e.data.js}\n})();`,
      );
      return run(requireShim, exports, module, consoleShim);
    })
    // grace period so pending timers, watch callbacks, and microtasks flush
    .then(() => new Promise((r) => setTimeout(r, 1000)))
    .then(() => self.postMessage({ type: "done" }))
    .catch((err: unknown) => {
      self.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
    });
};
