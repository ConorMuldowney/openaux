import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["coverage/**", ".worktrees/**"],
  },
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/internal/*", "@/src/modules/*/internal/*"],
              message:
                "Import only module public surfaces from @/src/modules/<module>/public.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
