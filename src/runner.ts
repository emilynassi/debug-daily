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

// Injected into every Worker so CommonJS output from the transpiler has a
// require() shim and Vue resolves to a simple mock.
const SHIM = `
var exports = {};
var module = { exports: exports };
var require = (function() {
  var _ref = function(v) {
    return Object.defineProperty({}, 'value', {
      get: function() { return v; },
      set: function(n) { v = n; },
      enumerable: true,
    });
  };
  var _computed = function(fn) {
    var getter = typeof fn === 'function' ? fn : fn.get;
    return Object.defineProperty({}, 'value', { get: getter, enumerable: true });
  };
  var _vue = {
    reactive: function(o) { return o; },
    ref: _ref,
    computed: _computed,
    watch: function() {},
    watchEffect: function(fn) { fn(); },
    onMounted: function() {},
    onUnmounted: function() {},
    onBeforeUnmount: function() {},
    defineComponent: function(o) { return o; },
    nextTick: function(fn) { return Promise.resolve().then(fn); },
    toRefs: function(o) { return o; },
    toRef: function(o, k) { return _ref(o[k]); },
  };
  var mocks = { vue: _vue };
  return function(mod) { return mocks[mod] || {}; };
})();
`;

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

    const workerSrc = `
      ${SHIM}
      var _console = {
        log: function() {
          var text = Array.prototype.slice.call(arguments).map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
            catch(_) { return String(a); }
          }).join(' ');
          self.postMessage({ type: 'log', text: text });
        }
      };
      _console.warn = _console.info = _console.log;

      (async function(console) {
        ${js}
      })(_console).then(function() {
        return new Promise(function(r) { setTimeout(r, 1000); });
      }).then(function() {
        self.postMessage({ type: 'done' });
      }).catch(function(e) {
        self.postMessage({ type: 'error', message: e.message });
      });
    `;

    const blob = new Blob([workerSrc], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    URL.revokeObjectURL(url);

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
  });
}
