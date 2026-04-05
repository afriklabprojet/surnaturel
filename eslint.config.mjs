import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Le plugin react-hooks v5 (intégré dans Next 16) inclut des règles
// expérimentales du React Compiler activées en "error" par défaut.
// On les repasse en "warn" pour ne pas bloquer le déploiement sur du code
// valide qui n'a simplement pas encore été optimisé par le compilateur.
const reactHooksPlugin = nextVitals[0]?.plugins?.["react-hooks"];

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
    // Fichiers générés par vitest coverage — pas de lint
    "coverage/**",
  ]),
  // Règles React Compiler (expérimentales) → warn au lieu d'error
  ...(reactHooksPlugin
    ? [
        {
          plugins: { "react-hooks": reactHooksPlugin },
          rules: {
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/static-components": "warn",
          },
        },
      ]
    : []),
  // Downgrade no-explicit-any à warning pour API routes et tests
  {
    files: ["src/app/api/**/*.ts", "__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
