# eslint-config

Common eslint config for all node.js repositories

## Install

Install packages
```shell
pnpm install  --save-dev  \
  @typescript-eslint/eslint-plugin@7 \
  @typescript-eslint/parser@7 \
  eslint@9 \
  eslint-config-prettier@9 \
  eslint-config-standard@17 \
  eslint-plugin-import@2 \
  eslint-import-resolver-typescript@3 \
  eslint-plugin-n@17 \
  eslint-plugin-prettier@5 \
  eslint-plugin-promise@6 \
  eslint-plugin-unused-imports@4 \
  prettier@3 \
  typescript@5 \
  @eslint/compat@1 \
  globals@15 \
  @eslint/js@9 \
  @eslint/eslintrc@3 \
  @stylistic/eslint-plugin@2 \
  @1inch/eslint-config@latest
```

And then add file `eslint.config.mjs`:
```javascript
import {fixupPluginRules} from "@eslint/compat";
import _import from "eslint-plugin-import";
import oneInchEslintConfig from "@1inch/eslint-config";

export default [
    ...oneInchEslintConfig,
    {
        plugins: {
            import: fixupPluginRules(_import),
        },
        settings: {
            "import/resolver": {
                typescript: {},
            },
        },
    }];
```

Remove .eslintignore and use special section in `eslint.config.mjs` for it. Root 1inch eslint config already have this ignores rules.
```javascript
import {fixupPluginRules} from "@eslint/compat";
import _import from "eslint-plugin-import";
import oneInchEslintConfig from "@1inch/eslint-config";

export default [
    ...oneInchEslintConfig,
    {
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
            "**/frontend",
            "**/migrations",
        ],
    },
    {
        plugins: {
            // ...
        },
        settings: {
            // ...
        },
    }];
```

Add prettier file `.prettierrc.js`:
```js
module.exports = {
  singleQuote: true,
  trailingComma: 'none',
  tabWidth: 2,
  printWidth: 120
}
```