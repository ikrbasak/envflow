---
"@ikrbasak/envflow": minor
---

Initial release.

- Type-safe environment loader for Node 22+.
- Cascade: `.env.defaults` → `.env` → `.env.local` → `.env.${nodeEnv}` → `.env.${nodeEnv}.local`. `*.local` slots are skipped when `nodeEnv === 'test'`.
- `loadEnv` and `loadEnvAsync` return `{ parsed, files }`; throw `EnvFlowError` on failure.
- Options use camelCase (`nodeEnv`, `defaultNodeEnv`, `purgePreloadedDotenv`, `override`, `silent`, `debug`, `cwd`, `pattern`, `files`, `encoding`, `onMissing`).
- Preload bridge at `@ikrbasak/envflow/config` for `node -r` and `node --import`.
- CLI flag mapper (`--node-env`, `--envflow-*`) and env-var mapper (`ENVFLOW_*`) feed the preload bridge.
- Dual ESM + CJS distribution via tsdown. Zero runtime dependencies.
