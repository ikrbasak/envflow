import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { loadEnv, loadEnvAsync, EnvFlowError } from "@/index.ts";

describe("loadEnv (sync)", () => {
  let dir: string;
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-load-"));
    envBackup = { ...process.env };
    for (const k of Object.keys(process.env)) {
      if (k.startsWith("ENVFLOW_TEST_")) delete process.env[k];
    }
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    process.env = envBackup;
  });

  function write(name: string, contents: string): void {
    writeFileSync(join(dir, name), contents);
  }

  it("loads a single .env into parsed and process.env", () => {
    write(".env", "ENVFLOW_TEST_A=one");
    const result = loadEnv({ cwd: dir });
    expect(result.parsed.ENVFLOW_TEST_A).toBe("one");
    expect(result.files).toHaveLength(1);
    expect(process.env.ENVFLOW_TEST_A).toBe("one");
  });

  it("cascades .env, .env.local, .env.<nodeEnv>, .env.<nodeEnv>.local", () => {
    write(".env", "A=1\nB=2\nC=3");
    write(".env.local", "B=local");
    write(".env.production", "C=prod");
    write(".env.production.local", "D=4");
    const result = loadEnv({ cwd: dir, nodeEnv: "production" });
    expect(result.parsed).toEqual({ A: "1", B: "local", C: "prod", D: "4" });
  });

  it('skips *.local files when nodeEnv is "test"', () => {
    write(".env", "A=1");
    write(".env.local", "A=local");
    write(".env.test", "A=test");
    write(".env.test.local", "A=testlocal");
    const result = loadEnv({ cwd: dir, nodeEnv: "test" });
    expect(result.parsed).toEqual({ A: "test" });
    expect(result.files.map((f) => basename(f))).toEqual([".env", ".env.test"]);
  });

  it("throws ENVFLOW_NO_FILES when nothing matches", () => {
    expect(() => loadEnv({ cwd: dir })).toThrow(EnvFlowError);
    try {
      loadEnv({ cwd: dir });
    } catch (e) {
      expect((e as EnvFlowError).code).toBe("ENVFLOW_NO_FILES");
    }
  });

  it("respects explicit `files` list and bypasses cascade", () => {
    write(".env", "IGNORED=1");
    write("custom.env", "ENVFLOW_TEST_X=picked");
    const result = loadEnv({ cwd: dir, files: ["custom.env"] });
    expect(result.parsed).toEqual({ ENVFLOW_TEST_X: "picked" });
    expect(result.files).toHaveLength(1);
  });

  it("skips missing entries from `files`", () => {
    write(".env", "A=1");
    const result = loadEnv({ cwd: dir, files: [".env", "missing.env"] });
    expect(result.parsed).toEqual({ A: "1" });
  });

  it("does not overwrite shell-defined vars by default", () => {
    write(".env", "ENVFLOW_TEST_SHELL=file");
    process.env.ENVFLOW_TEST_SHELL = "shell";
    loadEnv({ cwd: dir });
    expect(process.env.ENVFLOW_TEST_SHELL).toBe("shell");
  });

  it("overwrites shell-defined vars when override=true", () => {
    write(".env", "ENVFLOW_TEST_OVER=file");
    process.env.ENVFLOW_TEST_OVER = "shell";
    loadEnv({ cwd: dir, override: true });
    expect(process.env.ENVFLOW_TEST_OVER).toBe("file");
  });

  it("reads .env.defaults as the lowest cascade slot under the default pattern", () => {
    write(".env.defaults", "A=default\nB=default");
    write(".env", "B=main");
    const result = loadEnv({ cwd: dir });
    expect(result.parsed).toEqual({ A: "default", B: "main" });
  });

  it("purges a pre-loaded .env when purgePreloadedDotenv=true", () => {
    write(".env", "ENVFLOW_TEST_PURGE=fresh");
    process.env.ENVFLOW_TEST_PURGE = "fresh";
    loadEnv({ cwd: dir, purgePreloadedDotenv: true, override: false });
    expect(process.env.ENVFLOW_TEST_PURGE).toBe("fresh");
  });

  it("throws ENVFLOW_INVALID_PATTERN on empty pattern", () => {
    expect(() => loadEnv({ cwd: dir, pattern: "" })).toThrow(EnvFlowError);
  });

  it("picks up NODE_ENV from process.env when nodeEnv not given", () => {
    write(".env", "A=1");
    write(".env.staging", "A=staging");
    process.env.NODE_ENV = "staging";
    expect(loadEnv({ cwd: dir }).parsed).toEqual({ A: "staging" });
  });

  it("falls back to defaultNodeEnv when nothing else is set", () => {
    write(".env", "A=1");
    write(".env.dev", "A=dev");
    expect(loadEnv({ cwd: dir, defaultNodeEnv: "dev" }).parsed).toEqual({ A: "dev" });
  });
});

describe("loadEnvAsync", () => {
  let dir: string;
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-loadasync-"));
    envBackup = { ...process.env };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    process.env = envBackup;
  });

  function write(name: string, contents: string): void {
    writeFileSync(join(dir, name), contents);
  }

  it("matches sync output", async () => {
    write(".env", "A=1\nB=2");
    write(".env.production", "B=prod");
    const result = await loadEnvAsync({ cwd: dir, nodeEnv: "production" });
    expect(result.parsed).toEqual({ A: "1", B: "prod" });
  });

  it("rejects with ENVFLOW_NO_FILES when nothing matches", async () => {
    await expect(loadEnvAsync({ cwd: dir })).rejects.toThrow(EnvFlowError);
  });

  it("respects explicit files list", async () => {
    write("custom.env", "X=y");
    const result = await loadEnvAsync({ cwd: dir, files: ["custom.env"] });
    expect(result.parsed).toEqual({ X: "y" });
  });
});
