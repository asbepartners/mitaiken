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
    // Deno runtime, type-checked separately by the Supabase CLI/dashboard.
    "supabase/functions/**",
    // Native project directories (Capacitor/Bubblewrap). Contain vendored
    // project files and, under public/, a copy of the Next.js build output.
    "ios/**",
    "android/**",
  ]),
]);

export default eslintConfig;
