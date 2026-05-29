import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyEnv } from "@/core/apply.ts";
import { listEnvFiles } from "@/core/cascade.ts";
import { loadFiles } from "@/core/loader.ts";
import { parseEnv } from "@/core/parser.ts";
import { readTextSync, readTextAsync, fileExistsAsync } from "@/internal/fs.ts";
import { debugLog, warnLog } from "@/internal/debug.ts";
import { EnvFlowError } from "@/errors.ts";

describe("debug logger", () => {
  it("debugLog prints with prefix", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    debugLog("hello %s", "world");
    expect(spy).toHaveBeenCalledWith("[envflow] hello %s", "world");
    spy.mockRestore();
  });

  it("warnLog prints with prefix", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warnLog("oops");
    expect(spy).toHaveBeenCalledWith("[envflow] oops");
    spy.mockRestore();
  });
});

describe("apply.ts debug branches", () => {
  let backup: NodeJS.ProcessEnv;
  beforeEach(() => {
    backup = { ...process.env };
  });
  afterEach(() => {
    process.env = backup;
  });

  it("emits overwrite log when override=true and existing differs", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    process.env.ENVFLOW_DBG_A = "shell";
    applyEnv({ ENVFLOW_DBG_A: "file" }, { override: true, debug: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("emits kept log when shell-defined and debug=true", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    process.env.ENVFLOW_DBG_B = "shell";
    applyEnv({ ENVFLOW_DBG_B: "file" }, { debug: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("emits set log when new var with debug=true", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    delete process.env.ENVFLOW_DBG_C;
    applyEnv({ ENVFLOW_DBG_C: "v" }, { debug: true });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("cascade debug missing log", () => {
  it("logs missing slots when debug=true", () => {
    const dir = mkdtempSync(join(tmpdir(), "envflow-dbg-"));
    try {
      const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
      listEnvFiles({ cwd: dir, nodeEnv: "production", debug: true });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("loader overwrite debug log", () => {
  it("emits when later file overwrites earlier", () => {
    const dir = mkdtempSync(join(tmpdir(), "envflow-loader-dbg-"));
    try {
      const a = join(dir, "a.env");
      const b = join(dir, "b.env");
      writeFileSync(a, "K=one");
      writeFileSync(b, "K=two");
      const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
      loadFiles([a, b], { debug: true });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("fs error paths", () => {
  it("readTextSync wraps fs errors in EnvFlowError", () => {
    expect(() => readTextSync("/no/such/path/file.env")).toThrow(EnvFlowError);
  });

  it("readTextAsync rejects with EnvFlowError", async () => {
    await expect(readTextAsync("/no/such/path/file.env")).rejects.toThrow(EnvFlowError);
  });

  it("fileExistsAsync returns false for missing paths", async () => {
    expect(await fileExistsAsync("/no/such/path/file.env")).toBe(false);
  });
});

describe("parser uncovered escape branches", () => {
  it("treats \\ followed by unknown char inside double quotes literally", () => {
    expect(parseEnv('A="path\\zfoo"')).toEqual({ A: "path\\zfoo" });
  });

  it("handles \\r escape", () => {
    expect(parseEnv('A="\\r"')).toEqual({ A: "\r" });
  });

  it("handles escaped double quote inside double quoted value", () => {
    expect(parseEnv('A="say \\"hi\\""')).toEqual({ A: 'say "hi"' });
  });

  it("ignores line that has `export` followed immediately by non-space", () => {
    expect(parseEnv("exportFOO=1\nBAR=2")).toEqual({ BAR: "2" });
  });
});
