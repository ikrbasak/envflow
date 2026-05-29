import { EnvFlowError } from "@/errors.ts";

export const DEFAULT_PATTERN = ".env[.node_env][.local]";

const LOCAL_PLACEHOLDER = /\[(\W*\blocal\b\W*)\]/g;
const NODE_ENV_PLACEHOLDER = /\[(\W*\b)node_env(\b\W*)\]/g;

export function hasLocalPlaceholder(pattern: string): boolean {
  return new RegExp(LOCAL_PLACEHOLDER.source).test(pattern);
}

export function hasNodeEnvPlaceholder(pattern: string): boolean {
  return new RegExp(NODE_ENV_PLACEHOLDER.source).test(pattern);
}

export interface ComposeOptions {
  local?: boolean;
  nodeEnv?: string;
}

export function composeFilename(pattern: string, options: ComposeOptions = {}): string {
  let out = pattern.replace(LOCAL_PLACEHOLDER, options.local ? "$1" : "");
  out = out.replace(NODE_ENV_PLACEHOLDER, options.nodeEnv ? `$1${options.nodeEnv}$2` : "");
  return out;
}

export function assertValidPattern(pattern: string): void {
  if (typeof pattern !== "string" || pattern.length === 0) {
    throw new EnvFlowError("ENVFLOW_INVALID_PATTERN", "pattern must be a non-empty string");
  }
}
