const PREFIX = "[envflow]";

export function debugLog(message: string, ...rest: unknown[]): void {
  console.debug(`${PREFIX} ${message}`, ...rest);
}

export function warnLog(message: string, ...rest: unknown[]): void {
  console.warn(`${PREFIX} ${message}`, ...rest);
}
