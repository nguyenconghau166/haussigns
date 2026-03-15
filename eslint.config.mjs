import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade no-explicit-any to warn for API routes and pages where
  // Supabase's dynamic schema makes precise typing impractical.
  {
    files: ["app/api/**/*.ts", "app/admin/**/*.tsx", "app/blog/**/*.tsx", "app/contact/**/*.tsx", "app/portfolio/**/*.tsx", "app/services/**/*.tsx", "app/about/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;

