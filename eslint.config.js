import { baseConfig, browserConfig } from "@credit-decision-hub/eslint-config";

export default [
  {
    ignores: [
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
    ],
  },
  ...baseConfig,
  {
    files: [
      "apps/storybook/**/*.{ts,tsx}",
      "apps/web/**/*.{ts,tsx}",
      "packages/ui/**/*.{ts,tsx}",
    ],
    ...browserConfig,
  },
];
