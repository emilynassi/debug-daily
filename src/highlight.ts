/** Minimal token-based syntax highlighter for JS/TS code snippets. */
export function highlight(code: string): string {
  // Encode " as &quot; so the string-coloring pass below can't accidentally
  // match the " characters inside the <span style="..."> tags we inject.
  // ' doesn't appear in span attributes so it can stay literal.
  const esc = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return esc
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#6A9955">$1</span>')
    .replace(
      /\b(async|await|function|return|const|let|var|for|while|if|else|new|typeof|type|interface|extends|implements|export|import|from|of|in|class|true|false|null|undefined|void|never|string|number|boolean|any|unknown|keyof|as|satisfies)\b/g,
      '<span style="color:#569CD6">$1</span>'
    )
    .replace(
      /(&quot;[^&]*&quot;|'[^']*')/g,
      '<span style="color:#CE9178">$1</span>'
    )
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#B5CEA8">$1</span>');
}
