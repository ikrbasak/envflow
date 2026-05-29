import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeSlotNames, listEnvFiles } from "@/core/cascade.ts";
import { DEFAULT_PATTERN } from "@/internal/pattern.ts";

describe("computeSlotNames", () => {
  it("returns default cascade with default pattern", () => {
    expect(computeSlotNames(DEFAULT_PATTERN, undefined)).toEqual([
      ".env.defaults",
      ".env",
      ".env.local",
    ]);
  });

  it("appends node_env slots when nodeEnv is set", () => {
    expect(computeSlotNames(DEFAULT_PATTERN, "production")).toEqual([
      ".env.defaults",
      ".env",
      ".env.local",
      ".env.production",
      ".env.production.local",
    ]);
  });

  it('skips local slots when nodeEnv is "test"', () => {
    expect(computeSlotNames(DEFAULT_PATTERN, "test")).toEqual([
      ".env.defaults",
      ".env",
      ".env.test",
    ]);
  });

  it("omits .env.defaults for non-default patterns", () => {
    const slots = computeSlotNames(".env[.node_env]", "staging");
    expect(slots).toEqual([".env", ".env.staging"]);
  });
});

describe("listEnvFiles", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-cascade-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function touch(name: string, contents = "KEY=value\n"): void {
    writeFileSync(join(dir, name), contents);
  }

  it("returns only files that exist on disk", () => {
    touch(".env");
    touch(".env.production");
    const files = listEnvFiles({ cwd: dir, nodeEnv: "production" });
    expect(files).toEqual([join(dir, ".env"), join(dir, ".env.production")]);
  });

  it("preserves cascade order", () => {
    touch(".env.production.local");
    touch(".env");
    touch(".env.production");
    touch(".env.local");
    touch(".env.defaults");
    const files = listEnvFiles({ cwd: dir, nodeEnv: "production" });
    expect(files).toEqual([
      join(dir, ".env.defaults"),
      join(dir, ".env"),
      join(dir, ".env.local"),
      join(dir, ".env.production"),
      join(dir, ".env.production.local"),
    ]);
  });

  it("returns empty list when nothing matches", () => {
    expect(listEnvFiles({ cwd: dir })).toEqual([]);
  });

  it("skips .env.local in test environment", () => {
    touch(".env");
    touch(".env.local");
    touch(".env.test");
    touch(".env.test.local");
    const files = listEnvFiles({ cwd: dir, nodeEnv: "test" });
    expect(files).toEqual([join(dir, ".env"), join(dir, ".env.test")]);
  });
});
