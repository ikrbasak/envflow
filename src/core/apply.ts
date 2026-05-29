import { debugLog } from "@/internal/debug.ts";
import type { EnvRecord } from "@/core/types.ts";

export interface ApplyOptions {
  override?: boolean;
  debug?: boolean;
}

export function applyEnv(parsed: EnvRecord, options: ApplyOptions = {}): void {
  const { override = false, debug = false } = options;

  for (const key of Object.keys(parsed)) {
    const value = parsed[key] as string;
    const existing = process.env[key];

    if (existing === undefined || override) {
      if (debug && existing !== undefined && existing !== value) {
        debugLog(`${key} overwritten in process.env`);
      } else if (debug) {
        debugLog(`process.env.${key} set`);
      }
      process.env[key] = value;
    } else if (debug && existing !== value) {
      debugLog(`${key} kept (shell-defined)`);
    }
  }
}

export function unloadEnv(parsed: EnvRecord): void {
  for (const key of Object.keys(parsed)) {
    if (process.env[key] === parsed[key]) {
      delete process.env[key];
    }
  }
}
