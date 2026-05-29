import { describe, expect, it } from "vitest";
import {
  DEFAULT_PATTERN,
  composeFilename,
  hasLocalPlaceholder,
  hasNodeEnvPlaceholder,
  assertValidPattern,
} from "@/internal/pattern.ts";
import { EnvFlowError } from "@/errors.ts";

describe("pattern", () => {
  it("exposes the default pattern", () => {
    expect(DEFAULT_PATTERN).toBe(".env[.node_env][.local]");
  });

  describe("hasLocalPlaceholder", () => {
    it("detects [.local]", () => {
      expect(hasLocalPlaceholder(".env[.local]")).toBe(true);
      expect(hasLocalPlaceholder(DEFAULT_PATTERN)).toBe(true);
    });

    it("returns false when missing", () => {
      expect(hasLocalPlaceholder(".env")).toBe(false);
      expect(hasLocalPlaceholder(".env[.node_env]")).toBe(false);
    });
  });

  describe("hasNodeEnvPlaceholder", () => {
    it("detects [.node_env]", () => {
      expect(hasNodeEnvPlaceholder(DEFAULT_PATTERN)).toBe(true);
      expect(hasNodeEnvPlaceholder(".env[.node_env]")).toBe(true);
    });

    it("returns false when missing", () => {
      expect(hasNodeEnvPlaceholder(".env")).toBe(false);
      expect(hasNodeEnvPlaceholder(".env[.local]")).toBe(false);
    });
  });

  describe("composeFilename", () => {
    it("strips both placeholders by default", () => {
      expect(composeFilename(DEFAULT_PATTERN)).toBe(".env");
    });

    it("substitutes nodeEnv", () => {
      expect(composeFilename(DEFAULT_PATTERN, { nodeEnv: "production" })).toBe(".env.production");
    });

    it("substitutes local marker", () => {
      expect(composeFilename(DEFAULT_PATTERN, { local: true })).toBe(".env.local");
    });

    it("substitutes both", () => {
      expect(composeFilename(DEFAULT_PATTERN, { nodeEnv: "test", local: true })).toBe(
        ".env.test.local",
      );
    });

    it("handles custom pattern", () => {
      expect(composeFilename("config/[.node_env].env", { nodeEnv: "dev" })).toBe("config/.dev.env");
    });
  });

  describe("assertValidPattern", () => {
    it("accepts non-empty strings", () => {
      expect(() => assertValidPattern(".env")).not.toThrow();
    });

    it("throws EnvFlowError on empty string", () => {
      expect(() => assertValidPattern("")).toThrow(EnvFlowError);
      expect(() => assertValidPattern("")).toThrow(/non-empty/);
    });
  });
});
