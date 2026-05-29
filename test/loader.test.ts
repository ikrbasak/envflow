import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadFiles, loadFilesAsync } from "@/core/loader.ts";

describe("loadFiles", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-loader-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function write(name: string, contents: string): string {
    const full = join(dir, name);
    writeFileSync(full, contents);
    return full;
  }

  it("merges in the order given (last wins)", () => {
    const a = write(".env", "A=1\nB=2");
    const b = write(".env.local", "B=overridden\nC=3");
    expect(loadFiles([a, b])).toEqual({ A: "1", B: "overridden", C: "3" });
  });

  it("returns empty object for empty file list", () => {
    expect(loadFiles([])).toEqual({});
  });

  it("async variant matches sync", async () => {
    const a = write(".env", "A=1");
    const b = write(".env.local", "A=2\nB=3");
    expect(await loadFilesAsync([a, b])).toEqual({ A: "2", B: "3" });
  });

  it("async reads files in parallel and merges in given order", async () => {
    const a = write(".env", "A=1");
    const b = write(".env.local", "A=2");
    expect(await loadFilesAsync([a, b])).toEqual({ A: "2" });
    expect(await loadFilesAsync([b, a])).toEqual({ A: "1" });
  });
});
