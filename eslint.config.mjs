import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["coverage/**", ".worktrees/**"],
  },
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{tsx,jsx}"],
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/control-has-associated-label": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='style'][value.expression.type='ObjectExpression'] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(color|background|backgroundColor|borderColor|fill|stroke)$/]",
          message:
            "Use semantic design tokens and className utilities instead of inline color styles.",
        },
      ],
    },
  },
  {
    files: ["{app,components,src}/**/*.{ts,tsx,js,jsx}"],
    ignores: ["components/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@radix-ui/*"],
              message:
                "Import shadcn primitives from @/components/ui/* instead of Radix packages directly.",
            },
          ],
        },
      ],
    },
  },
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
