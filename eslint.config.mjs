import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const layerRule = (patterns) => [
  "error",
  {
    patterns,
  },
];

export default [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": layerRule([
        "@/app/**",
        "@/widgets/**",
        "@/features/**",
        "@/entities/**",
        "@/actions/**",
      ]),
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": layerRule(["@/app/**", "@/widgets/**"]),
    },
  },
  {
    files: ["src/widgets/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": layerRule(["@/app/**"]),
    },
  },
  {
    files: ["src/**/*.presentational.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='useEffect']",
          message: "Presentational components cannot use useEffect.",
        },
        {
          selector: "CallExpression[callee.name='useLayoutEffect']",
          message: "Presentational components cannot use useLayoutEffect.",
        },
        {
          selector: "CallExpression[callee.name='useInsertionEffect']",
          message: "Presentational components cannot use useInsertionEffect.",
        },
        {
          selector: "CallExpression[callee.name='useState']",
          message: "Presentational components cannot own local state.",
        },
        {
          selector: "CallExpression[callee.name='useReducer']",
          message: "Presentational components cannot own local reducer state.",
        },
        {
          selector: "CallExpression[callee.name='useRef']",
          message: "Presentational components cannot own local refs.",
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message: "Presentational components cannot perform fetch requests.",
        },
      ],
    },
  },
];
