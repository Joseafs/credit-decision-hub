import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);

export const browserConfig = {
  languageOptions: {
    globals: globals.browser,
  },
};
