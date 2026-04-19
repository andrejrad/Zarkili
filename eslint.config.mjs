import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "functions/**",
      "app.config.ts",
      "babel.config.js",
      "jest.config.js",
      "jest.rules.config.js",
      "__tests__/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["App.tsx", "src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}", "jest.setup.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
      import: importPlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "react/react-in-jsx-scope": "off",
      "import/order": [
        "warn",
        {
          "newlines-between": "always"
        }
      ]
    }
  },
  prettier
];
