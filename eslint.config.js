import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/contexts/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/api-app",
              message:
                "Legacy app API is internal-only. Use '@/lib/api-v1' (reads) and '@/lib/api-v1-mutations' (writes).",
            },
            {
              name: "../lib/api-app",
              message:
                "Legacy app API is internal-only. Use '@/lib/api-v1' (reads) and '@/lib/api-v1-mutations' (writes).",
            },
            {
              name: "../../lib/api-app",
              message:
                "Legacy app API is internal-only. Use '@/lib/api-v1' (reads) and '@/lib/api-v1-mutations' (writes).",
            },
          ],
        },
      ],
    },
  },
);
