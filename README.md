# eslint-config

Common eslint config for all node.js repositories

## Install

Install packages
```shell
pnpm install --save-dev @1inch/eslint-config@latest
```

Also it is required to install peer dependencies

And then add file `eslint.config.mjs`:
```javascript
import oneInchEslintConfig from "@1inch/eslint-config";

export default oneInchEslintConfig
```

Remove .eslintignore and use special section in `eslint.config.mjs` for it. Root 1inch eslint config already have this ignores rules.
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
            "**/.eslintrc-tmp.js",
            "**/dist",
            "**/*.json",
            "**/*.yml",
            "**/*.html",
            "**/graph.serviceuser.postgres.repository.service.ts",
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
    tabWidth: 4,
    printWidth: 120,
    bracketSpacing: false,
    semi: false
}
```
