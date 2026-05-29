import { resolve as resolvePath } from "node:path";
import { listEnvFiles } from "@/core/cascade.ts";
import { applyEnv, unloadEnv } from "@/core/apply.ts";
import { loadFiles, loadFilesAsync } from "@/core/loader.ts";
import { parseEnv } from "@/core/parser.ts";
import { fileExists, fileExistsAsync, readTextSync, readTextAsync } from "@/internal/fs.ts";
import { debugLog, warnLog } from "@/internal/debug.ts";
import { assertValidPattern, DEFAULT_PATTERN } from "@/internal/pattern.ts";
import { EnvFlowError } from "@/errors.ts";
import type { EnvRecord, LoadOptions, LoadResult, ListEnvFilesOptions } from "@/core/types.ts";

export { DEFAULT_PATTERN } from "@/internal/pattern.ts";
export { EnvFlowError } from "@/errors.ts";
export type { EnvFlowErrorCode } from "@/errors.ts";
export type { EnvRecord, LoadOptions, LoadResult, ListEnvFilesOptions } from "@/core/types.ts";
export { parseEnv } from "@/core/parser.ts";
export { listEnvFiles } from "@/core/cascade.ts";
export { unloadEnv } from "@/core/apply.ts";

export function loadEnv<T extends EnvRecord = EnvRecord>(options: LoadOptions = {}): LoadResult<T> {
  const {
    cwd = process.cwd(),
    pattern = DEFAULT_PATTERN,
    encoding = "utf8",
    override = false,
    purgePreloadedDotenv = false,
    onMissing = "throw",
    silent = false,
    debug = false,
  } = options;

  assertValidPattern(pattern);

  if (purgePreloadedDotenv) {
    purgeDotenv({ cwd, encoding, silent, debug });
  }

  const files = resolveFiles({ ...options, cwd, pattern, debug });
  if (files.length === 0) {
    if (onMissing === "skip") {
      if (debug) debugLog(`no env files matched in ${cwd}, returning empty result`);
      return { parsed: {} as T, files: [] };
    }
    throw new EnvFlowError(
      "ENVFLOW_NO_FILES",
      `no env files found in ${cwd} (pattern: ${pattern})`,
    );
  }

  const parsed = loadFiles(files, { encoding, debug });
  applyEnv(parsed, { override, debug });

  return { parsed: parsed as T, files };
}

export async function loadEnvAsync<T extends EnvRecord = EnvRecord>(
  options: LoadOptions = {},
): Promise<LoadResult<T>> {
  const {
    cwd = process.cwd(),
    pattern = DEFAULT_PATTERN,
    encoding = "utf8",
    override = false,
    purgePreloadedDotenv = false,
    onMissing = "throw",
    silent = false,
    debug = false,
  } = options;

  assertValidPattern(pattern);

  if (purgePreloadedDotenv) {
    await purgeDotenvAsync({ cwd, encoding, silent, debug });
  }

  const files = await resolveFilesAsync({ ...options, cwd, pattern, debug });
  if (files.length === 0) {
    if (onMissing === "skip") {
      if (debug) debugLog(`no env files matched in ${cwd}, returning empty result`);
      return { parsed: {} as T, files: [] };
    }
    throw new EnvFlowError(
      "ENVFLOW_NO_FILES",
      `no env files found in ${cwd} (pattern: ${pattern})`,
    );
  }

  const parsed = await loadFilesAsync(files, { encoding, debug });
  applyEnv(parsed, { override, debug });

  return { parsed: parsed as T, files };
}

interface ResolveFilesOptions
  extends
    Required<Pick<LoadOptions, "cwd" | "pattern" | "debug">>,
    Pick<LoadOptions, "files" | "nodeEnv" | "defaultNodeEnv"> {}

function resolveFiles(opts: ResolveFilesOptions): readonly string[] {
  if (opts.files) {
    return opts.files
      .map((basename) => resolvePath(opts.cwd, basename))
      .filter((full) => {
        const ok = fileExists(full);
        if (!ok && opts.debug) debugLog(`-- ${full} (missing, skipped)`);
        return ok;
      });
  }
  return listEnvFiles(buildListOptions(opts));
}

async function resolveFilesAsync(opts: ResolveFilesOptions): Promise<readonly string[]> {
  if (opts.files) {
    const checks = await Promise.all(
      opts.files.map(async (basename) => {
        const full = resolvePath(opts.cwd, basename);
        const ok = await fileExistsAsync(full);
        if (!ok && opts.debug) debugLog(`-- ${full} (missing, skipped)`);
        return ok ? full : undefined;
      }),
    );
    return checks.filter((x): x is string => x !== undefined);
  }
  return listEnvFiles(buildListOptions(opts));
}

function buildListOptions(opts: ResolveFilesOptions): ListEnvFilesOptions {
  const nodeEnv = effectiveNodeEnv(opts);
  const base: ListEnvFilesOptions = { cwd: opts.cwd, pattern: opts.pattern, debug: opts.debug };
  return nodeEnv === undefined ? base : { ...base, nodeEnv };
}

function effectiveNodeEnv(
  opts: Pick<LoadOptions, "nodeEnv" | "defaultNodeEnv" | "debug">,
): string | undefined {
  if (opts.nodeEnv) {
    if (opts.debug) debugLog(`nodeEnv="${opts.nodeEnv}" (from options)`);
    return opts.nodeEnv;
  }
  if (process.env.NODE_ENV) {
    if (opts.debug) debugLog(`nodeEnv="${process.env.NODE_ENV}" (from process.env.NODE_ENV)`);
    return process.env.NODE_ENV;
  }
  if (opts.defaultNodeEnv) {
    if (opts.debug) debugLog(`nodeEnv="${opts.defaultNodeEnv}" (from defaultNodeEnv)`);
    return opts.defaultNodeEnv;
  }
  if (opts.debug) debugLog("nodeEnv unset");
  return undefined;
}

interface PurgeOptions {
  cwd: string;
  encoding: BufferEncoding;
  silent: boolean;
  debug: boolean;
}

function purgeDotenv(opts: PurgeOptions): void {
  const path = resolvePath(opts.cwd, ".env");
  if (!fileExists(path)) return;
  try {
    unloadEnv(parseEnv(readTextSync(path, opts.encoding)));
    if (opts.debug) debugLog(`purged pre-loaded ${path}`);
  } catch (cause) {
    if (!opts.silent) warnLog(`failed to purge ${path}`, cause);
  }
}

async function purgeDotenvAsync(opts: PurgeOptions): Promise<void> {
  const path = resolvePath(opts.cwd, ".env");
  if (!(await fileExistsAsync(path))) return;
  try {
    unloadEnv(parseEnv(await readTextAsync(path, opts.encoding)));
    if (opts.debug) debugLog(`purged pre-loaded ${path}`);
  } catch (cause) {
    if (!opts.silent) warnLog(`failed to purge ${path}`, cause);
  }
}
