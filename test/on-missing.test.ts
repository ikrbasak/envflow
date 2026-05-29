import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnv, loadEnvAsync, EnvFlowError } from "@/index.ts";

describe("onMissing option", () => {
  let dir: string;
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-on-missing-"));
    envBackup = { ...process.env };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    process.env = envBackup;
  });

  describe("loadEnv (sync)", () => {
    it("throws ENVFLOW_NO_FILES by default", () => {
      expect(() => loadEnv({ cwd: dir })).toThrow(EnvFlowError);
    });

    it("throws when onMissing='throw' is explicit", () => {
      expect(() => loadEnv({ cwd: dir, onMissing: "throw" })).toThrow(EnvFlowError);
    });

    it("returns empty result when onMissing='skip'", () => {
      const result = loadEnv({ cwd: dir, onMissing: "skip" });
      expect(result).toEqual({ parsed: {}, files: [] });
    });

    it("onMissing='skip' also covers explicit `files` list when none exist", () => {
      const result = loadEnv({ cwd: dir, files: ["nope.env"], onMissing: "skip" });
      expect(result).toEqual({ parsed: {}, files: [] });
    });
  });

  describe("loadEnvAsync", () => {
    it("rejects by default", async () => {
      await expect(loadEnvAsync({ cwd: dir })).rejects.toThrow(EnvFlowError);
    });

    it("returns empty result when onMissing='skip'", async () => {
      const result = await loadEnvAsync({ cwd: dir, onMissing: "skip" });
      expect(result).toEqual({ parsed: {}, files: [] });
    });
  });
});
