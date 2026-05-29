import { describe, expect, it } from "vitest";
import { parseEnv } from "@/core/parser.ts";

describe("parseEnv", () => {
  it("parses simple KEY=VALUE pairs", () => {
    expect(parseEnv("A=1\nB=2")).toEqual({ A: "1", B: "2" });
  });

  it("accepts Buffer input", () => {
    expect(parseEnv(Buffer.from("A=1"))).toEqual({ A: "1" });
  });

  it("strips UTF-8 BOM", () => {
    expect(parseEnv("﻿A=1")).toEqual({ A: "1" });
  });

  it("treats # as comment at line start", () => {
    expect(parseEnv("# top\nA=1\n# again")).toEqual({ A: "1" });
  });

  it("treats # as inline comment in unquoted values", () => {
    expect(parseEnv("A=foo # trailing")).toEqual({ A: "foo" });
  });

  it("preserves # inside double quotes", () => {
    expect(parseEnv('A="foo # not a comment"')).toEqual({ A: "foo # not a comment" });
  });

  it("preserves # inside single quotes", () => {
    expect(parseEnv("A='foo # nope'")).toEqual({ A: "foo # nope" });
  });

  it("handles escape sequences in double quotes", () => {
    expect(parseEnv('A="line1\\nline2\\tend"')).toEqual({ A: "line1\nline2\tend" });
  });

  it("does not unescape inside single quotes", () => {
    expect(parseEnv("A='line1\\nline2'")).toEqual({ A: "line1\\nline2" });
  });

  it("supports multi-line double-quoted values", () => {
    expect(parseEnv('A="line1\nline2"\nB=2')).toEqual({ A: "line1\nline2", B: "2" });
  });

  it("handles `export` prefix", () => {
    expect(parseEnv("export A=1\nexport B=2")).toEqual({ A: "1", B: "2" });
  });

  it("handles whitespace around `=`", () => {
    expect(parseEnv("A = 1\nB= 2\nC =3")).toEqual({ A: "1", B: "2", C: "3" });
  });

  it("handles empty values", () => {
    expect(parseEnv("A=\nB=")).toEqual({ A: "", B: "" });
  });

  it("trims trailing whitespace from unquoted values", () => {
    expect(parseEnv("A=foo   \nB=bar")).toEqual({ A: "foo", B: "bar" });
  });

  it("preserves leading/trailing whitespace inside quotes", () => {
    expect(parseEnv('A="  spaced  "')).toEqual({ A: "  spaced  " });
  });

  it("skips lines without a key", () => {
    expect(parseEnv("=novalue\nA=1")).toEqual({ A: "1" });
  });

  it("skips lines without `=`", () => {
    expect(parseEnv("JUSTKEY\nA=1")).toEqual({ A: "1" });
  });

  it("accepts CRLF line endings", () => {
    expect(parseEnv("A=1\r\nB=2\r\n")).toEqual({ A: "1", B: "2" });
  });

  it("escapes $ inside double quotes", () => {
    expect(parseEnv('A="\\$VAR"')).toEqual({ A: "$VAR" });
  });

  it("parses keys with underscores and digits", () => {
    expect(parseEnv("FOO_BAR_1=ok")).toEqual({ FOO_BAR_1: "ok" });
  });
});
