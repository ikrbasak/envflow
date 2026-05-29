import type { LoadOptions } from "@/core/types.ts";

const MAP: Record<string, keyof LoadOptions> = {
  NODE_ENV: "nodeEnv",
  ENVFLOW_DEFAULT_NODE_ENV: "defaultNodeEnv",
  ENVFLOW_CWD: "cwd",
  ENVFLOW_PATTERN: "pattern",
  ENVFLOW_ENCODING: "encoding",
  ENVFLOW_OVERRIDE: "override",
  ENVFLOW_PURGE: "purgePreloadedDotenv",
  ENVFLOW_ON_MISSING: "onMissing",
  ENVFLOW_DEBUG: "debug",
  ENVFLOW_SILENT: "silent",
};

const BOOL_KEYS = new Set<keyof LoadOptions>([
  "override",
  "purgePreloadedDotenv",
  "debug",
  "silent",
]);

export function resolveOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): Partial<LoadOptions> {
  const out: Partial<LoadOptions> = {};
  for (const [envKey, optKey] of Object.entries(MAP)) {
    const raw = env[envKey];
    if (raw === undefined) continue;
    if (BOOL_KEYS.has(optKey)) {
      assign(out, optKey, parseBool(raw));
    } else {
      assign(out, optKey, raw);
    }
  }
  return out;
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function assign<K extends keyof LoadOptions>(
  target: Partial<LoadOptions>,
  key: K,
  value: LoadOptions[K] | string | boolean,
): void {
  (target as Record<string, unknown>)[key] = value;
}
