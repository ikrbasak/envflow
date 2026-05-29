import { describe, expect, it } from "vitest";
import { EnvFlowError } from "@/errors.ts";

describe("EnvFlowError", () => {
  it("carries a code", () => {
    const err = new EnvFlowError("ENVFLOW_NO_FILES", "nope");
    expect(err.code).toBe("ENVFLOW_NO_FILES");
    expect(err.message).toBe("nope");
    expect(err.name).toBe("EnvFlowError");
  });

  it("supports cause via Error options", () => {
    const cause = new Error("inner");
    const err = new EnvFlowError("ENVFLOW_READ_FAILED", "outer", { cause });
    expect(err.cause).toBe(cause);
  });

  it("is an instance of Error", () => {
    expect(new EnvFlowError("ENVFLOW_PARSE_FAILED", "x")).toBeInstanceOf(Error);
  });
});
