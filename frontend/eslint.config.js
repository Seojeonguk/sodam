// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint"; // TypeScript ESLint 관련 유틸리티 (플러그인, 파서, 권장 규칙 포함)
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ...pluginJs.configs.recommended,
  },
  {
    // 2. TypeScript 관련 설정 (여기서 tseslint 플러그인이 이미 등록되어 있습니다)
    files: ["**/*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    // tseslint.config을 사용하면 내부적으로 @typescript-eslint 플러그인이 등록됩니다.
    // 하지만, 다른 rules 객체에서 사용하려면 해당 객체에도 플러그인 정의가 필요할 수 있습니다.
  },
  {
    // 3. React 관련 설정
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // 4. Vite Fast Refresh 관련 설정
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-refresh": pluginReactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // 5. Prettier와 충돌하는 ESLint 규칙 비활성화
    ...prettierConfig,
  },
  {
    // 6. 개별 규칙 커스터마이징 (여기 수정)
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      // <-- 여기 추가
      "@typescript-eslint": tseslint.plugin, // <-- tseslint에서 플러그인 객체 가져와 등록
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // ... 기타 개별 규칙 ...
    },
  },
  {
    // 7. 특정 파일 무시
    ignores: [
      "dist/",
      "node_modules/",
      "**/*.jsconfig.json",
      "eslint.config.js",
      ".prettierrc.cjs",
    ],
  },
);
