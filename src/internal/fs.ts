import { existsSync, readFileSync } from "node:fs";
import { readFile, access } from "node:fs/promises";
import { EnvFlowError } from "@/errors.ts";

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export async function fileExistsAsync(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function readTextSync(path: string, encoding: BufferEncoding = "utf8"): string {
  try {
    return readFileSync(path, { encoding });
  } catch (cause) {
    throw new EnvFlowError("ENVFLOW_READ_FAILED", `failed to read ${path}`, { cause });
  }
}

export async function readTextAsync(
  path: string,
  encoding: BufferEncoding = "utf8",
): Promise<string> {
  try {
    return await readFile(path, { encoding });
  } catch (cause) {
    throw new EnvFlowError("ENVFLOW_READ_FAILED", `failed to read ${path}`, { cause });
  }
}
