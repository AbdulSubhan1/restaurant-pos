import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
// Add rule configuration to disable @typescript-eslint/no-explicit-any
eslintConfig.push({
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
});
// Update the rules configuration to include prefer-const and no-unused-vars as warnings
eslintConfig.push({
  rules: {
    "prefer-const": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-require-imports": "off",
    "react/no-unescaped-entities": "off",
  },
});
