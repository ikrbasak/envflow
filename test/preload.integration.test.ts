import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const PRELOAD = join(process.cwd(), "dist/config.cjs");
const PRELOAD_MJS = join(process.cwd(), "dist/config.mjs");

describe("preload bridge (dist/config)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "envflow-preload-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  async function runWithPreload(
    args: string[],
    extraEnv: NodeJS.ProcessEnv = {},
  ): Promise<Record<string, string | undefined>> {
    const helper = join(dir, "helper.cjs");
    writeFileSync(
      helper,
      `process.stdout.write(JSON.stringify({ A: process.env.A, B: process.env.B, ENVFLOW_TEST_KEY: process.env.ENVFLOW_TEST_KEY }));`,
    );
    const { stdout } = await exec(process.execPath, ["-r", PRELOAD, helper, ...args], {
      cwd: dir,
      env: { ...extraEnv, PATH: process.env.PATH } as NodeJS.ProcessEnv,
    });
    return JSON.parse(stdout) as Record<string, string | undefined>;
  }

  async function runWithPreloadMjs(
    args: string[],
    extraEnv: NodeJS.ProcessEnv = {},
  ): Promise<Record<string, string | undefined>> {
    const helper = join(dir, "helper.mjs");
    writeFileSync(
      helper,
      `process.stdout.write(JSON.stringify({ A: process.env.A, B: process.env.B, ENVFLOW_TEST_KEY: process.env.ENVFLOW_TEST_KEY }));`,
    );
    const { stdout } = await exec(
      process.execPath,
      ["--import", `file://${PRELOAD_MJS}`, helper, ...args],
      { cwd: dir, env: { ...extraEnv, PATH: process.env.PATH } as NodeJS.ProcessEnv },
    );
    return JSON.parse(stdout) as Record<string, string | undefined>;
  }

  it("loads .env via `-r` CommonJS preload", async () => {
    writeFileSync(join(dir, ".env"), "A=one\nB=two");
    const env = await runWithPreload([]);
    expect(env.A).toBe("one");
    expect(env.B).toBe("two");
  });

  it("loads .env via `--import` ESM preload", async () => {
    writeFileSync(join(dir, ".env"), "A=one\nB=two");
    const env = await runWithPreloadMjs([]);
    expect(env.A).toBe("one");
    expect(env.B).toBe("two");
  });

  it("honors --node-env CLI flag", async () => {
    writeFileSync(join(dir, ".env"), "ENVFLOW_TEST_KEY=base");
    writeFileSync(join(dir, ".env.staging"), "ENVFLOW_TEST_KEY=staging");
    const env = await runWithPreload(["--node-env", "staging"]);
    expect(env.ENVFLOW_TEST_KEY).toBe("staging");
  });

  it("honors NODE_ENV env var", async () => {
    writeFileSync(join(dir, ".env"), "ENVFLOW_TEST_KEY=base");
    writeFileSync(join(dir, ".env.production"), "ENVFLOW_TEST_KEY=prod");
    const env = await runWithPreload([], { NODE_ENV: "production" });
    expect(env.ENVFLOW_TEST_KEY).toBe("prod");
  });

  it("silently no-ops when no env files exist", async () => {
    const env = await runWithPreload([]);
    expect(env.A).toBeUndefined();
  });
});
