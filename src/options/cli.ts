import type { LoadOptions } from "@/core/types.ts";

interface FlagSpec {
  key: keyof LoadOptions;
  type: "string" | "boolean";
}

const FLAGS: Record<string, FlagSpec> = {
  "--node-env": { key: "nodeEnv", type: "string" },
  "--default-node-env": { key: "defaultNodeEnv", type: "string" },
  "--envflow-cwd": { key: "cwd", type: "string" },
  "--envflow-pattern": { key: "pattern", type: "string" },
  "--envflow-encoding": { key: "encoding", type: "string" },
  "--envflow-override": { key: "override", type: "boolean" },
  "--envflow-purge": { key: "purgePreloadedDotenv", type: "boolean" },
  "--envflow-on-missing": { key: "onMissing", type: "string" },
  "--envflow-debug": { key: "debug", type: "boolean" },
  "--envflow-silent": { key: "silent", type: "boolean" },
};

export function resolveOptionsFromCli(
  argv: readonly string[] = process.argv.slice(2),
): Partial<LoadOptions> {
  const out: Partial<LoadOptions> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;

    const eq = arg.indexOf("=");
    const flag = eq === -1 ? arg : arg.slice(0, eq);
    const spec = FLAGS[flag];
    if (!spec) continue;

    if (spec.type === "boolean") {
      const raw = eq === -1 ? "true" : arg.slice(eq + 1);
      assign(out, spec.key, parseBool(raw));
      continue;
    }

    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined) continue;
    assign(out, spec.key, value);
  }

  return out;
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on" || v === "";
}

function assign<K extends keyof LoadOptions>(
  target: Partial<LoadOptions>,
  key: K,
  value: LoadOptions[K] | string | boolean,
): void {
  (target as Record<string, unknown>)[key] = value;
}
