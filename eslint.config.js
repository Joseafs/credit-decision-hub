import { baseConfig, browserConfig } from "@credit-decision-hub/eslint-config";

export default [
  {
    ignores: ["**/coverage/**", "**/dist/**", "**/node_modules/**"],
  },
  ...baseConfig,
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    ...browserConfig,
  },
];
