import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyEnv, unloadEnv } from "@/core/apply.ts";

describe("applyEnv", () => {
  let backup: NodeJS.ProcessEnv;

  beforeEach(() => {
    backup = { ...process.env };
  });

  afterEach(() => {
    process.env = backup;
  });

  it("fills in undefined keys", () => {
    delete process.env.ENVFLOW_TEST_A;
    applyEnv({ ENVFLOW_TEST_A: "hello" });
    expect(process.env.ENVFLOW_TEST_A).toBe("hello");
  });

  it("does not overwrite shell-defined values by default", () => {
    process.env.ENVFLOW_TEST_B = "shell";
    applyEnv({ ENVFLOW_TEST_B: "file" });
    expect(process.env.ENVFLOW_TEST_B).toBe("shell");
  });

  it("overwrites when override=true", () => {
    process.env.ENVFLOW_TEST_C = "shell";
    applyEnv({ ENVFLOW_TEST_C: "file" }, { override: true });
    expect(process.env.ENVFLOW_TEST_C).toBe("file");
  });
});

describe("unloadEnv", () => {
  let backup: NodeJS.ProcessEnv;

  beforeEach(() => {
    backup = { ...process.env };
  });

  afterEach(() => {
    process.env = backup;
  });

  it("removes only keys whose current value matches", () => {
    process.env.ENVFLOW_UNLOAD_A = "match";
    process.env.ENVFLOW_UNLOAD_B = "changed";
    unloadEnv({ ENVFLOW_UNLOAD_A: "match", ENVFLOW_UNLOAD_B: "original" });
    expect(process.env.ENVFLOW_UNLOAD_A).toBeUndefined();
    expect(process.env.ENVFLOW_UNLOAD_B).toBe("changed");
  });
});
