import { EnvFlowError } from "@/errors.ts";
import type { EnvRecord } from "@/core/types.ts";

const BOM = 0xfeff;

export function parseEnv(input: string | Buffer): EnvRecord {
  try {
    const text = typeof input === "string" ? input : input.toString("utf8");
    const src = text.charCodeAt(0) === BOM ? text.slice(1) : text;
    return parseSource(src);
  } catch (cause) {
    if (cause instanceof EnvFlowError) throw cause;
    throw new EnvFlowError("ENVFLOW_PARSE_FAILED", "failed to parse env source", { cause });
  }
}

function parseSource(src: string): EnvRecord {
  const out: EnvRecord = {};
  const n = src.length;
  let i = 0;

  while (i < n) {
    i = skipInlineWs(src, i);
    if (i >= n) break;

    const c = src[i];
    if (c === "\n" || c === "\r" || c === "#") {
      i = nextLine(src, i);
      continue;
    }

    if (startsWithToken(src, i, "export")) {
      i += "export".length;
      if (src[i] !== " " && src[i] !== "\t") {
        i = nextLine(src, i);
        continue;
      }
      i = skipInlineWs(src, i);
    }

    const keyStart = i;
    while (i < n && isKeyChar(src.charCodeAt(i))) i++;
    if (i === keyStart) {
      i = nextLine(src, i);
      continue;
    }
    const key = src.slice(keyStart, i);

    i = skipInlineWs(src, i);
    if (src[i] !== "=") {
      i = nextLine(src, i);
      continue;
    }
    i++;
    i = skipInlineWs(src, i);

    const q = src[i];
    let value: string;
    if (q === '"' || q === "'") {
      const r = readQuoted(src, i + 1, q);
      value = r.value;
      i = r.next;
      i = nextLine(src, i);
    } else {
      const valStart = i;
      while (i < n && src[i] !== "\n" && src[i] !== "\r" && src[i] !== "#") i++;
      value = src.slice(valStart, i).trimEnd();
      i = nextLine(src, i);
    }

    out[key] = value;
  }

  return out;
}

function readQuoted(src: string, start: number, quote: '"' | "'"): { value: string; next: number } {
  const n = src.length;
  let buf = "";
  let i = start;

  while (i < n) {
    const ch = src[i];
    if (ch === quote) return { value: buf, next: i + 1 };

    if (ch === "\\" && quote === '"' && i + 1 < n) {
      const next = src[i + 1];
      switch (next) {
        case "n":
          buf += "\n";
          i += 2;
          continue;
        case "r":
          buf += "\r";
          i += 2;
          continue;
        case "t":
          buf += "\t";
          i += 2;
          continue;
        case "\\":
          buf += "\\";
          i += 2;
          continue;
        case '"':
          buf += '"';
          i += 2;
          continue;
        case "$":
          buf += "$";
          i += 2;
          continue;
        default:
          buf += ch ?? "";
          i++;
          continue;
      }
    }

    buf += ch ?? "";
    i++;
  }

  return { value: buf, next: i };
}

function skipInlineWs(src: string, i: number): number {
  while (i < src.length && (src[i] === " " || src[i] === "\t")) i++;
  return i;
}

function nextLine(src: string, i: number): number {
  while (i < src.length && src[i] !== "\n") i++;
  return i + 1;
}

function startsWithToken(src: string, i: number, token: string): boolean {
  for (let k = 0; k < token.length; k++) {
    if (src[i + k] !== token[k]) return false;
  }
  return true;
}

function isKeyChar(code: number): boolean {
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    code === 95
  );
}
