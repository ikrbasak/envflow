import { describe, expect, it } from "vitest";
import { resolveOptionsFromCli } from "@/options/cli.ts";

describe("resolveOptionsFromCli", () => {
  it("returns empty when no flags", () => {
    expect(resolveOptionsFromCli([])).toEqual({});
  });

  it("parses --flag value pairs", () => {
    expect(resolveOptionsFromCli(["--node-env", "production"])).toEqual({
      nodeEnv: "production",
    });
  });

  it("parses --flag=value", () => {
    expect(resolveOptionsFromCli(["--envflow-pattern=.env"])).toEqual({
      pattern: ".env",
    });
  });

  it("treats boolean flags as true when present", () => {
    expect(resolveOptionsFromCli(["--envflow-debug", "--envflow-silent"])).toEqual({
      debug: true,
      silent: true,
    });
  });

  it("accepts boolean flag with explicit value", () => {
    expect(resolveOptionsFromCli(["--envflow-debug=false"])).toEqual({ debug: false });
  });

  it("parses multiple flags together", () => {
    expect(
      resolveOptionsFromCli([
        "--node-env",
        "staging",
        "--envflow-cwd=/tmp/x",
        "--envflow-override",
      ]),
    ).toEqual({
      nodeEnv: "staging",
      cwd: "/tmp/x",
      override: true,
    });
  });

  it("ignores unknown flags", () => {
    expect(resolveOptionsFromCli(["--unknown", "foo", "--node-env", "dev"])).toEqual({
      nodeEnv: "dev",
    });
  });
});
