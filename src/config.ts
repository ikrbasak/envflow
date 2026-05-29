import { loadEnv } from "@/index.ts";
import { resolveOptions } from "@/options/resolve.ts";
import { warnLog } from "@/internal/debug.ts";

try {
  // Preload should never blow up apps that have no env files.
  loadEnv({ onMissing: "skip", ...resolveOptions() });
} catch (error) {
  warnLog("preload failed", error);
}
