import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveOptions } from "@/options/resolve.ts";

describe("resolveOptions", () => {
  let envBackup: NodeJS.ProcessEnv;
  let argvBackup: string[];

  beforeEach(() => {
    envBackup = { ...process.env };
    argvBackup = process.argv;
    process.env = {};
    process.argv = ["node", "script"];
  });

  afterEach(() => {
    process.env = envBackup;
    process.argv = argvBackup;
  });

  it("returns empty when nothing is set", () => {
    expect(resolveOptions()).toEqual({});
  });

  it("env vars override defaults", () => {
    process.env.NODE_ENV = "staging";
    expect(resolveOptions()).toEqual({ nodeEnv: "staging" });
  });

  it("CLI flags override env vars", () => {
    process.env.NODE_ENV = "staging";
    process.argv = ["node", "script", "--node-env", "production"];
    expect(resolveOptions()).toEqual({ nodeEnv: "production" });
  });

  it("programmatic options override CLI", () => {
    process.env.NODE_ENV = "staging";
    process.argv = ["node", "script", "--node-env", "production"];
    expect(resolveOptions({ nodeEnv: "test" })).toEqual({ nodeEnv: "test" });
  });
});
