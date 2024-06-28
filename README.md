# eslint-config

Common eslint config for all node.js repositories

## Install

Add to package.json
```json
"devDependencies": {
        ...
    "@typescript-eslint/eslint-plugin": "^7.14.1",
    "@typescript-eslint/parser": "^7.14.1",
    "eslint": "^9.5.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-config-standard": "^17.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-n": "^17.9.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-promise": "^6.2.0",
    "eslint-plugin-unused-imports": "^4.0.0",
    "prettier": "^3.3.2",
    "typescript": "^5.5.2",
    "@eslint/compat": "^1.1.0",
    "globals": "^15.6.0",
    "@eslint/js": "^9.5.0",
    "@eslint/eslintrc": "^3.1.0"
}
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

## Release new version 

```bash
# patch
$ yarn release --patch

# minot
$ yarn release --minor

# major
$ yarn release --major

# exact
$ yarn release v1.0.0
```