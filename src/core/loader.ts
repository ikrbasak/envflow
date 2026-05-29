import { readTextSync, readTextAsync } from "@/internal/fs.ts";
import { parseEnv } from "@/core/parser.ts";
import { debugLog } from "@/internal/debug.ts";
import type { EnvRecord } from "@/core/types.ts";

export interface LoaderOptions {
  encoding?: BufferEncoding;
  debug?: boolean;
}

export function loadFiles(files: readonly string[], options: LoaderOptions = {}): EnvRecord {
  const merged: EnvRecord = {};
  for (const file of files) {
    const text = readTextSync(file, options.encoding);
    mergeParsed(merged, parseEnv(text), file, options.debug);
  }
  return merged;
}

export async function loadFilesAsync(
  files: readonly string[],
  options: LoaderOptions = {},
): Promise<EnvRecord> {
  const sources = await Promise.all(
    files.map((file) => readTextAsync(file, options.encoding).then((text) => ({ file, text }))),
  );

  const merged: EnvRecord = {};
  for (const { file, text } of sources) {
    mergeParsed(merged, parseEnv(text), file, options.debug);
  }
  return merged;
}

function mergeParsed(target: EnvRecord, parsed: EnvRecord, file: string, debug?: boolean): void {
  for (const key of Object.keys(parsed)) {
    if (debug && Object.hasOwn(target, key) && target[key] !== parsed[key]) {
      debugLog(`${key} overwritten by ${file}`);
    }
    target[key] = parsed[key] as string;
  }
}
