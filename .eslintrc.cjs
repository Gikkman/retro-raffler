module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:vue/vue3-essential"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "vue"],
  root: true,

  env: {
    node: true,
    browser: true,
    es2021: true,
  },

  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module"
  },

  ignorePatterns: ["_compile/**/*"],

  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "_",
        varsIgnorePattern: "_",
      }
    ],
    "curly": ["error", "all"],

    "indent": ["error", 2],
    "brace-style": ["error", "stroustrup"],
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
    "object-curly-newline": ["error", { consistent: true }],
    "semi": ["error","always"],
  }
};
