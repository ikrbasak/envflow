# @ikrbasak/envflow

Type-safe, `NODE_ENV`-aware environment loader for Node 22+. Zero runtime dependencies.

```sh
pnpm add @ikrbasak/envflow
# or: npm install @ikrbasak/envflow
# or: yarn add @ikrbasak/envflow
```

## Quickstart

```ts
import { loadEnv } from "@ikrbasak/envflow";

const { parsed, files } = loadEnv();
console.log(parsed); // { … }
console.log(files); // ['/abs/path/.env', '/abs/path/.env.production', …]
```

Async variant for parallel reads:

```ts
import { loadEnvAsync } from "@ikrbasak/envflow";

const { parsed } = await loadEnvAsync({ nodeEnv: "production" });
```

## How files are resolved

With the default pattern `.env[.node_env][.local]`, files are loaded in this order — later entries override earlier ones:

| Slot                    | When                            | Loaded for `nodeEnv = 'production'` |
| ----------------------- | ------------------------------- | ----------------------------------- |
| `.env.defaults`         | Only when pattern is default    | `.env.defaults`                     |
| `.env`                  | Always                          | `.env`                              |
| `.env.local`            | Skipped if `nodeEnv === 'test'` | `.env.local`                        |
| `.env.${nodeEnv}`       | Only when `nodeEnv` is set      | `.env.production`                   |
| `.env.${nodeEnv}.local` | Skipped if `nodeEnv === 'test'` | `.env.production.local`             |

Shell-defined variables (already in `process.env`) win over file contents — unless `override: true` is set.

## Options

| Option                 | Type                | Default                   | Notes                                                                                                                                |
| ---------------------- | ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cwd`                  | `string`            | `process.cwd()`           | Where to look for `.env*` files.                                                                                                     |
| `nodeEnv`              | `string`            | —                         | Falls back to `process.env.NODE_ENV`, then `defaultNodeEnv`.                                                                         |
| `defaultNodeEnv`       | `string`            | —                         | Used only when nothing else sets the env.                                                                                            |
| `pattern`              | `string`            | `.env[.node_env][.local]` | Filename template; placeholders `[.node_env]` and `[.local]` are replaced or stripped.                                               |
| `files`                | `readonly string[]` | —                         | Explicit list (relative to `cwd`). Bypasses the cascade.                                                                             |
| `encoding`             | `BufferEncoding`    | `'utf8'`                  | File encoding.                                                                                                                       |
| `override`             | `boolean`           | `false`                   | When `true`, parsed values overwrite existing `process.env`.                                                                         |
| `purgePreloadedDotenv` | `boolean`           | `false`                   | Removes a pre-loaded `.env` from `process.env` before applying the cascade (useful when a dependency calls `dotenv.config()` first). |
| `onMissing`            | `"throw" \| "skip"` | `"throw"`                 | What to do when no env files match. `"throw"` raises `EnvFlowError`; `"skip"` returns `{ parsed: {}, files: [] }` silently.          |
| `silent`               | `boolean`           | `false`                   | Suppresses warning logs. Errors still throw.                                                                                         |
| `debug`                | `boolean`           | `false`                   | Verbose logging of every step.                                                                                                       |

`loadEnv` throws an `EnvFlowError` on failure — there is no `{ error }` return convention.

```ts
import { EnvFlowError } from "@ikrbasak/envflow";

try {
  loadEnv();
} catch (e) {
  if (e instanceof EnvFlowError && e.code === "ENVFLOW_NO_FILES") {
    // No .env* files matched — perhaps a fresh checkout.
  }
}
```

Error codes: `ENVFLOW_NO_FILES`, `ENVFLOW_PARSE_FAILED`, `ENVFLOW_READ_FAILED`, `ENVFLOW_INVALID_PATTERN`.

To opt out of the `ENVFLOW_NO_FILES` throw entirely:

```ts
const { parsed, files } = loadEnv({ onMissing: "skip" });
// parsed = {}, files = [] when nothing matched — never throws ENVFLOW_NO_FILES
```

The preload bridge (`@ikrbasak/envflow/config`) uses `onMissing: "skip"` by default so missing env files never break apps that opt in via `node --import`.

## Preload (zero-code adoption)

Run any script with the loader wired up before your code executes:

```sh
node --import @ikrbasak/envflow/config app.mjs
node -r @ikrbasak/envflow/config app.cjs
```

The preload bridge merges options from env vars and CLI flags (CLI wins).

### CLI flags

| Flag                            | Maps to                      |
| ------------------------------- | ---------------------------- |
| `--node-env <value>`            | `nodeEnv`                    |
| `--default-node-env <value>`    | `defaultNodeEnv`             |
| `--envflow-cwd <path>`          | `cwd`                        |
| `--envflow-pattern <pattern>`   | `pattern`                    |
| `--envflow-encoding <encoding>` | `encoding`                   |
| `--envflow-override`            | `override: true`             |
| `--envflow-purge`               | `purgePreloadedDotenv: true` |
| `--envflow-on-missing <mode>`   | `onMissing` (`throw\|skip`)  |
| `--envflow-debug`               | `debug: true`                |
| `--envflow-silent`              | `silent: true`               |

Both `--flag value` and `--flag=value` forms are supported.

### Env vars

| Env var                    | Maps to                |
| -------------------------- | ---------------------- |
| `NODE_ENV`                 | `nodeEnv`              |
| `ENVFLOW_DEFAULT_NODE_ENV` | `defaultNodeEnv`       |
| `ENVFLOW_CWD`              | `cwd`                  |
| `ENVFLOW_PATTERN`          | `pattern`              |
| `ENVFLOW_ENCODING`         | `encoding`             |
| `ENVFLOW_OVERRIDE`         | `override`             |
| `ENVFLOW_PURGE`            | `purgePreloadedDotenv` |
| `ENVFLOW_ON_MISSING`       | `onMissing`            |
| `ENVFLOW_DEBUG`            | `debug`                |
| `ENVFLOW_SILENT`           | `silent`               |

Boolean values: `1`, `true`, `yes`, `on` are truthy; everything else is falsy.

Precedence, low → high: built-in defaults → env vars → CLI flags → programmatic options.

## Explicit file list

Skip the cascade entirely with an exact list:

```ts
loadEnv({ files: ["config/base.env", "config/local.env"] });
```

Missing entries are silently skipped (and logged if `debug: true`).

## Custom pattern

```ts
loadEnv({ pattern: "config/[.node_env].env", nodeEnv: "production" });
// reads:  config/.env, config/.production.env
```

`[.node_env]` is substituted with `.${nodeEnv}` (or stripped if no env). `[.local]` works the same way with a `.local` suffix.

## TypeScript

`loadEnv` is generic over the shape of `parsed` — useful when combined with a schema validator:

```ts
interface Env {
  DATABASE_URL: string;
  PORT: string;
}

const { parsed } = loadEnv<Env>();
// parsed.DATABASE_URL is typed string
```

(The runtime does not validate — pair it with `zod` or similar.)

## Low-level API

```ts
import { parseEnv, listEnvFiles, unloadEnv, DEFAULT_PATTERN } from "@ikrbasak/envflow";

parseEnv("KEY=value"); // → { KEY: 'value' }
listEnvFiles({ nodeEnv: "production" }); // → string[]
unloadEnv({ KEY: "value" }); // removes from process.env when current value matches
```

## License

[MIT](./LICENSE) © Krishna Basak
