import { describe, expect, it } from "vitest";
import { resolveOptionsFromEnv } from "@/options/env.ts";

describe("resolveOptionsFromEnv", () => {
  it("returns empty when no env vars set", () => {
    expect(resolveOptionsFromEnv({})).toEqual({});
  });

  it("maps NODE_ENV to nodeEnv", () => {
    expect(resolveOptionsFromEnv({ NODE_ENV: "production" })).toEqual({
      nodeEnv: "production",
    });
  });

  it("maps ENVFLOW_* prefixed vars", () => {
    expect(
      resolveOptionsFromEnv({
        ENVFLOW_CWD: "/tmp",
        ENVFLOW_PATTERN: ".env",
        ENVFLOW_ENCODING: "utf8",
        ENVFLOW_DEFAULT_NODE_ENV: "development",
      }),
    ).toEqual({
      cwd: "/tmp",
      pattern: ".env",
      encoding: "utf8",
      defaultNodeEnv: "development",
    });
  });

  it("parses boolean truthy variants", () => {
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "true" })).toEqual({ debug: true });
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "1" })).toEqual({ debug: true });
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "yes" })).toEqual({ debug: true });
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "on" })).toEqual({ debug: true });
  });

  it("parses boolean falsy variants", () => {
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "false" })).toEqual({ debug: false });
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "0" })).toEqual({ debug: false });
    expect(resolveOptionsFromEnv({ ENVFLOW_DEBUG: "" })).toEqual({ debug: false });
  });
});
