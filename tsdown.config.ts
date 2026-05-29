import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    config: "src/config.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node22",
  platform: "node",
  treeshake: true,
  sourcemap: true,
});
