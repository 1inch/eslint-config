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

## Testing preset (opt-in)

`@1inch/eslint-config/testing` is a separate, **opt-in** preset enforcing test-coverage
conventions for NestJS services with a hexagonal layout (ported from `aqua-api`).
It is NOT part of the default export — enabling the main config does not enable these rules.

Requires `@1inch/eslint-config` >= the first release containing the preset (expected `5.1.0`).
The preset itself is dependency-free (plain rule objects) and runs under ESLint 9 and ESLint 10.

```javascript
import oneInchEslintConfig from "@1inch/eslint-config";
import oneInchTestingConfig from "@1inch/eslint-config/testing";

export default [
    ...oneInchEslintConfig,
    ...oneInchTestingConfig,
];
```

The preset registers a single plugin namespace `1inch-testing` and enables all six rules
at `error` severity with the default options below.

### Rules

| Rule | Enforces |
|---|---|
| `1inch-testing/require-test-for-class-or-function` | every exported testable artifact (concrete class, function, arrow/function expression) has a sibling unit test; `.cache.ts` files may have an integration test instead |
| `1inch-testing/require-controller-integration-test` | `*.controller.ts`, `*.scheduler.ts`, `*.consumer.ts`, `*.listener.ts`, `*.worker.ts` under `/controllers/` have a sibling integration test |
| `1inch-testing/require-secondary-adapter-integration-test` | `*.repository.ts`, `*.client.ts`, `*.producer.ts`, `*.service.ts` under `/secondary/` have a sibling integration test |
| `1inch-testing/require-use-case-unit-test` | `*.use-case.ts` under `/core/` has a sibling unit test |
| `1inch-testing/require-cache-integration-test` | `*.cache.ts` under `/src/components/` has a sibling integration test |
| `1inch-testing/no-internal-overrides-in-integration-tests` | integration tests do not override internal implementation (`.overrideProvider(...)`, `.overrideGuard(...)`, `.overrideInterceptor(...)`, `.overridePipe(...)`, `.overrideFilter(...)`, `.useValue(...)`, `.useClass(...)`, `.useFactory(...)`, `.useExisting(...)` method calls are forbidden; provider-definition object properties like `{provide: X, useValue: Y}` remain allowed) |

### Rule options and defaults

Every rule accepts a single options object. Defaults reproduce the aqua-api conventions exactly.

`pathIncludes` is a list of path fragments that must ALL be present in the file path for the
rule to apply (AND semantics). To scope a rule to several alternative locations, add extra
flat-config entries restricted via `files`.

| Rule | Option | Default |
|---|---|---|
| `require-test-for-class-or-function` | `pathIncludes` | `['/src/components/', '/core/']` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| | `cacheFileSuffix` | `'.cache.ts'` |
| `require-controller-integration-test` | `pathIncludes` | `['/controllers/']` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-secondary-adapter-integration-test` | `pathIncludes` | `['/secondary/']` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-use-case-unit-test` | `pathIncludes` | `['/core/']` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-cache-integration-test` | `pathIncludes` | `['/src/components/']` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `no-internal-overrides-in-integration-tests` | `integrationTestSuffixes` | `['.integration.test.ts', '.integration.spec.ts']` |

Repos using `.spec.ts` naming (e.g. `cross-chain-trader`) override the suffixes:

```javascript
import oneInchEslintConfig from "@1inch/eslint-config";
import oneInchTestingConfig from "@1inch/eslint-config/testing";

const specNaming = { unitTestSuffix: ".spec.ts", integrationTestSuffix: ".integration.spec.ts" };

export default [
    ...oneInchEslintConfig,
    ...oneInchTestingConfig,
    {
        rules: {
            "1inch-testing/require-test-for-class-or-function": ["error", specNaming],
            "1inch-testing/require-controller-integration-test": ["error", specNaming],
            "1inch-testing/require-secondary-adapter-integration-test": ["error", specNaming],
            "1inch-testing/require-use-case-unit-test": ["error", specNaming],
            "1inch-testing/require-cache-integration-test": ["error", specNaming],
            // .integration.spec.ts is already covered by the defaults
        },
    },
];
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
  eslint@10 \
  @eslint/js@10 \
  typescript-eslint@8 \
  eslint-plugin-import-x@4 \
  eslint-import-resolver-typescript@4 \
  eslint-config-prettier@10 \
  eslint-plugin-unused-imports@4 \
  @stylistic/eslint-plugin@5 \
  globals@17
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
