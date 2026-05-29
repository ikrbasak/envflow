import type { LoadOptions } from "@/core/types.ts";
import { resolveOptionsFromCli } from "@/options/cli.ts";
import { resolveOptionsFromEnv } from "@/options/env.ts";

/**
 * Compose the effective options by merging, in precedence order
 * (low → high): defaults < env vars < CLI flags < programmatic options.
 */
export function resolveOptions(programmatic: LoadOptions = {}): LoadOptions {
  return {
    ...resolveOptionsFromEnv(),
    ...resolveOptionsFromCli(),
    ...programmatic,
  };
}
