# eslint-config

Common eslint config for all node.js repositories

## Install

Install packages
```shell
pnpm install  --save-dev  \
  typescript-eslint@8 \
  eslint@9 \
  eslint-config-prettier@10 \
  eslint-plugin-import-x@4 \
  eslint-import-resolver-typescript@4 \
  eslint-plugin-prettier@5 \
  eslint-plugin-unused-imports@4 \
  prettier@3 \
  typescript@5 \
  @eslint/js@9 \
  @stylistic/eslint-plugin@5 \
  globals@16 \
  @1inch/eslint-config@latest
```

And then add file `eslint.config.mjs`:
```javascript
import oneInchEslintConfig from "@1inch/eslint-config";

export default oneInchEslintConfig
```

Remove `.eslintrc.js` / `.eslintrc.json` and `.eslintignore` — ESLint 9 flat config replaces them.

Use `eslint.config.mjs` for ignores and custom rules:
```javascript
import oneInchEslintConfig from "@1inch/eslint-config";

export default [
    ...oneInchEslintConfig,
    {
        ignores: [
            "**/*.mock.ts",
            "**/node_modules",
            "**/.github",
            "**/.idea",
            "**/dist",
            "**/*.json",
            "**/*.yml",
            "**/*.html",
            "**/migrations",
        ],
    },
    {
        settings: {
            "import-x/resolver": {
                typescript: {}
            }
        },
        rules: {
            // your custom rules here
        }
    }
];
```

Add prettier file `.prettierrc.js`:
```js
module.exports = {
    singleQuote: true,
    trailingComma: 'none',
    tabWidth: 4,
    printWidth: 120,
    bracketSpacing: false,
    semi: false
}
```

## Migration from v3

### Breaking changes

1. **ESLint flat config only** — delete `.eslintrc.js` / `.eslintrc.json` and `.eslintignore`, create `eslint.config.mjs` instead

2. **`eslint-plugin-import` replaced by `eslint-plugin-import-x`** — all `import/` rule prefixes and settings changed to `import-x/`:

| Before (v3) | After (v4) |
|---|---|
| `plugins: ['import']` | not needed (included in config) |
| `settings: { 'import/resolver': { typescript: {} } }` | `settings: { 'import-x/resolver': { typescript: {} } }` |
| `rules: { 'import/order': ... }` | `rules: { 'import-x/order': ... }` |

3. **Removed packages** — uninstall these, they are no longer needed:
```shell
pnpm remove \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-import \
  eslint-config-standard \
  eslint-plugin-n \
  eslint-plugin-promise \
  @eslint/compat \
  @eslint/eslintrc
```

4. **New packages** — install these instead:
```shell
pnpm install --save-dev \
  typescript-eslint@8 \
  eslint-plugin-import-x@4 \
  eslint-import-resolver-typescript@4 \
  eslint-config-prettier@10 \
  @stylistic/eslint-plugin@5 \
  globals@16
```

### Example migration

Before (`.eslintrc.js`):
```js
module.exports = {
    extends: ['@1inch'],
    plugins: ['import'],
    settings: {
        'import/resolver': {
            typescript: {}
        }
    },
    rules: {
    }
}
```

After (`eslint.config.mjs`):
```javascript
import oneInchEslintConfig from "@1inch/eslint-config";

export default [
    ...oneInchEslintConfig,
    {
        settings: {
            "import-x/resolver": {
                typescript: {}
            }
        },
        rules: {
        }
    }
];
```
