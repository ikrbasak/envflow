export type EnvFlowErrorCode =
  | "ENVFLOW_NO_FILES"
  | "ENVFLOW_PARSE_FAILED"
  | "ENVFLOW_READ_FAILED"
  | "ENVFLOW_INVALID_PATTERN";

export class EnvFlowError extends Error {
  override readonly name = "EnvFlowError" as const;
  readonly code: EnvFlowErrorCode;

  constructor(code: EnvFlowErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
  }
}
