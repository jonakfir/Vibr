/**
 * Tiny syntax highlighter for the IDE chat and diff views.
 *
 * State-machine tokenizer rather than nested regex replace, because
 * regex replace breaks on strings that contain `//` or keywords that
 * appear inside comments. Handles TypeScript / JavaScript / JSX / TSX
 * well enough to look like Claude Code's output. Unknown languages
 * fall through to escaped plaintext.
 *
 * The output is an HTML string safe to drop into dangerouslySetInnerHTML
 * — every token value is HTML-escaped before being wrapped in a span.
 */

const KEYWORDS = new Set([
  "abstract",
  "any",
  "as",
  "async",
  "await",
  "boolean",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "namespace",
  "never",
  "new",
  "null",
  "number",
  "of",
  "package",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "set",
  "static",
  "string",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "unknown",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

const BUILTINS = new Set([
  "Array",
  "Object",
  "String",
  "Number",
  "Boolean",
  "Promise",
  "Map",
  "Set",
  "Date",
  "Error",
  "Math",
  "JSON",
  "Symbol",
  "RegExp",
  "console",
  "window",
  "document",
  "process",
  "require",
  "module",
  "exports",
  "global",
  "React",
]);

type TokenType =
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "builtin"
  | "type"
  | "fn"
  | "punct"
  | "text";

interface Token {
  type: TokenType;
  value: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenizeTs(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  while (i < n) {
    const c = code[i];
    const next = code[i + 1];

    // Line comment
    if (c === "/" && next === "/") {
      let j = i;
      while (j < n && code[j] !== "\n") j++;
      tokens.push({ type: "comment", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Block comment
    if (c === "/" && next === "*") {
      const end = code.indexOf("*/", i + 2);
      if (end === -1) {
        tokens.push({ type: "comment", value: code.slice(i) });
        i = n;
      } else {
        tokens.push({ type: "comment", value: code.slice(i, end + 2) });
        i = end + 2;
      }
      continue;
    }

    // String (single, double, template)
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        // Template literals can span multiple lines and contain ${...}
        if (quote === "`" && code[j] === "$" && code[j + 1] === "{") {
          // Skip to matching }
          let depth = 1;
          j += 2;
          while (j < n && depth > 0) {
            if (code[j] === "{") depth++;
            else if (code[j] === "}") depth--;
            j++;
          }
          continue;
        }
        j++;
      }
      tokens.push({ type: "string", value: code.slice(i, Math.min(j + 1, n)) });
      i = Math.min(j + 1, n);
      continue;
    }

    // Number
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9._eExX]/.test(code[j])) j++;
      tokens.push({ type: "number", value: code.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier
    if (/[a-zA-Z_$]/.test(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      // Function call? Look ahead past whitespace for a '('
      let k = j;
      while (k < n && /\s/.test(code[k])) k++;
      const isCall = code[k] === "(";

      if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (BUILTINS.has(word)) {
        tokens.push({ type: "builtin", value: word });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ type: "type", value: word });
      } else if (isCall) {
        tokens.push({ type: "fn", value: word });
      } else {
        tokens.push({ type: "text", value: word });
      }
      i = j;
      continue;
    }

    // Everything else — single-char punctuation / whitespace
    tokens.push({ type: "punct", value: c });
    i++;
  }

  return tokens;
}

function tokenizeJson(code: string): Token[] {
  // JSON is a strict subset of JS for our purposes.
  return tokenizeTs(code);
}

function tokenizeCss(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      if (end === -1) {
        tokens.push({ type: "comment", value: code.slice(i) });
        i = n;
      } else {
        tokens.push({ type: "comment", value: code.slice(i, end + 2) });
        i = end + 2;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let j = i + 1;
      while (j < n && code[j] !== quote) {
        if (code[j] === "\\") j += 2;
        else j++;
      }
      tokens.push({ type: "string", value: code.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (/[a-zA-Z_-]/.test(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      // Rough: words followed by `:` are properties
      let k = j;
      while (k < n && /\s/.test(code[k])) k++;
      if (code[k] === ":") tokens.push({ type: "type", value: word });
      else tokens.push({ type: "text", value: word });
      i = j;
      continue;
    }
    tokens.push({ type: "punct", value: c });
    i++;
  }
  return tokens;
}

function renderTokens(tokens: Token[]): string {
  let out = "";
  for (const t of tokens) {
    const v = escapeHtml(t.value);
    switch (t.type) {
      case "comment":
        out += `<span class="hl-comment">${v}</span>`;
        break;
      case "string":
        out += `<span class="hl-string">${v}</span>`;
        break;
      case "number":
        out += `<span class="hl-number">${v}</span>`;
        break;
      case "keyword":
        out += `<span class="hl-keyword">${v}</span>`;
        break;
      case "builtin":
        out += `<span class="hl-builtin">${v}</span>`;
        break;
      case "type":
        out += `<span class="hl-type">${v}</span>`;
        break;
      case "fn":
        out += `<span class="hl-fn">${v}</span>`;
        break;
      default:
        out += v;
    }
  }
  return out;
}

/** Highlight a code string for the given language.
 *  Returns an HTML string safe to drop in dangerouslySetInnerHTML. */
export function highlight(code: string, lang: string): string {
  const l = (lang || "").toLowerCase();
  if (
    l === "ts" ||
    l === "tsx" ||
    l === "typescript" ||
    l === "js" ||
    l === "jsx" ||
    l === "javascript"
  ) {
    return renderTokens(tokenizeTs(code));
  }
  if (l === "json") {
    return renderTokens(tokenizeJson(code));
  }
  if (l === "css" || l === "scss") {
    return renderTokens(tokenizeCss(code));
  }
  return escapeHtml(code);
}

/** Best-effort language guess from a file path. */
export function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (ext === "tsx") return "tsx";
  if (ext === "ts") return "ts";
  if (ext === "jsx") return "jsx";
  if (ext === "js") return "js";
  if (ext === "mjs" || ext === "cjs") return "js";
  if (ext === "json") return "json";
  if (ext === "css") return "css";
  if (ext === "scss") return "scss";
  if (ext === "md" || ext === "mdx") return "md";
  if (ext === "html") return "html";
  return "";
}
