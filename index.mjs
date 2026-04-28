import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import unusedImports from 'eslint-plugin-unused-imports'
import prettierPlugin from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

export default tseslint.config({
    ignores: [
        "**/*.mock.ts",
        "**/node_modules",
        "**/.github",
        "**/.idea",
        "**/.eslintrc-tmp.js",
        "**/dist",
        "**/*.json",
        "**/*.yml",
        "**/*.html",
        "**/graph.serviceuser.postgres.repository.service.ts",
        "**/migrations",
    ],
},
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
{
    plugins: {
        "unused-imports": unusedImports,
        "prettier": prettierPlugin,
        "@stylistic": stylistic,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },
    },

    settings: {
        "import-x/resolver": {
            typescript: {},
        },
    },

    rules: {
        "import-x/namespace": "off",
        "import-x/default": "off",
        "@typescript-eslint/member-ordering": "error",
        "lines-between-class-members": "error",

        "padding-line-between-statements": ["error", {
            blankLine: "always",
            prev: "*",
            next: "return",
        }, {
            blankLine: "always",
            prev: "*",
            next: "if",
        }, {
            blankLine: "always",
            prev: "if",
            next: "*",
        }, {
            blankLine: "always",
            prev: "for",
            next: "*",
        }, {
            blankLine: "always",
            prev: "*",
            next: "for",
        }],

        "@typescript-eslint/adjacent-overload-signatures": "off",
        "no-unused-vars": "off",
        "no-prototype-builtins": "off",

        "max-len": ["error", {
            code: 120,
            ignoreComments: true,
            ignorePattern: "import\\s.+\\sfrom\\s'.+';?$",
        }],

        "max-depth": ["error", 3],
        "max-lines-per-function": ["error", 255],
        "max-params": ["error", 10],
        "@typescript-eslint/no-explicit-any": "warn",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: '^_'
        }],

        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": 0,
        "no-async-promise-executor": 0,
        "no-console": "error",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-non-null-assertion": "off",

        "import-x/order": ["error", {
            groups: ["external", "builtin", "internal", "sibling", "parent", "index"],
        }],
        "prettier/prettier": ["error", { "semi": false }],
        "@stylistic/comma-dangle": ["error", "never"],
    },
}, {
    files: ["src/**/*.test.ts", "src/**/*.integration-test.ts", "src/**/*.spec.ts"],

    rules: {
        "max-lines-per-function": ["error", 1000],

        "max-len": ["error", {
            code: 1130,
        }],
    },
},
    eslintConfigPrettier
)
