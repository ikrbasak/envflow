export type EnvRecord = Record<string, string>;

export interface LoadOptions {
  /** Working directory the cascade is resolved against. Default: `process.cwd()`. */
  cwd?: string;
  /** Active environment. Falls back to `process.env.NODE_ENV`, then `defaultNodeEnv`. */
  nodeEnv?: string;
  /** Used only when neither `nodeEnv` nor `process.env.NODE_ENV` is set. */
  defaultNodeEnv?: string;
  /** Naming pattern. Default: `.env[.node_env][.local]`. */
  pattern?: string;
  /** Explicit list of files to load (relative to `cwd`). Bypasses pattern + `nodeEnv`. */
  files?: readonly string[];
  /** File encoding. Default: `'utf8'`. */
  encoding?: BufferEncoding;
  /** When true, parsed values overwrite existing `process.env` entries. Default: `false`. */
  override?: boolean;
  /** When true, remove a pre-loaded `.env` from `process.env` before applying the cascade. */
  purgePreloadedDotenv?: boolean;
  /**
   * Behavior when no env files match.
   * - `"throw"` (default): raises `EnvFlowError` with code `ENVFLOW_NO_FILES`.
   * - `"skip"`: returns `{ parsed: {}, files: [] }` silently.
   */
  onMissing?: "throw" | "skip";
  /** Suppress warning logs. Errors still throw. */
  silent?: boolean;
  /** Verbose logging. */
  debug?: boolean;
}

export interface ListEnvFilesOptions {
  cwd?: string;
  nodeEnv?: string;
  pattern?: string;
  debug?: boolean;
}

export interface LoadResult<T extends EnvRecord = EnvRecord> {
  /** The merged map of variables, in cascade order. */
  parsed: T;
  /** Absolute paths of the files that were actually read. */
  files: readonly string[];
}
