import { resolve } from "node:path";
import {
  DEFAULT_PATTERN,
  assertValidPattern,
  composeFilename,
  hasLocalPlaceholder,
  hasNodeEnvPlaceholder,
} from "@/internal/pattern.ts";
import { debugLog } from "@/internal/debug.ts";
import { fileExists } from "@/internal/fs.ts";
import type { ListEnvFilesOptions } from "@/core/types.ts";

export function listEnvFiles(options: ListEnvFilesOptions = {}): readonly string[] {
  const { nodeEnv, cwd = process.cwd(), pattern = DEFAULT_PATTERN, debug = false } = options;

  assertValidPattern(pattern);

  if (debug) debugLog("listing env files…");

  const slotNames = computeSlotNames(pattern, nodeEnv);
  const out: string[] = [];

  for (const name of slotNames) {
    const full = resolve(cwd, name);
    if (fileExists(full)) {
      if (debug) debugLog(`>> ${full}`);
      out.push(full);
    } else if (debug) {
      debugLog(`-- ${full} (missing)`);
    }
  }

  return out;
}

export function computeSlotNames(pattern: string, nodeEnv: string | undefined): readonly string[] {
  const slots: string[] = [];
  const hasLocal = hasLocalPlaceholder(pattern);
  const hasEnv = hasNodeEnvPlaceholder(pattern);
  const isTest = nodeEnv === "test";

  if (pattern === DEFAULT_PATTERN) slots.push(".env.defaults");

  slots.push(composeFilename(pattern));

  if (hasLocal && !isTest) slots.push(composeFilename(pattern, { local: true }));

  if (nodeEnv && hasEnv) {
    slots.push(composeFilename(pattern, { nodeEnv }));
    if (hasLocal && !isTest) {
      slots.push(composeFilename(pattern, { nodeEnv, local: true }));
    }
  }

  return slots;
}
