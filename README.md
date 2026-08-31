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
conventions. It is NOT part of the default export — enabling the main config does not
enable these rules.

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

The preset registers a single plugin namespace `1inch-testing`. Five rules are enabled at
`error` severity; `require-test-for-class-or-function` is registered but left off, because it
only means something once a repo has chosen a scope for it (see below).

The enabled rules identify an artifact by its filename suffix and apply **wherever the file
lives**, so a repo does not have to describe its folder layout to get enforcement.

### Rules

| Rule | Enforces | Default |
|---|---|---|
| `1inch-testing/require-controller-integration-test` | `*.controller.ts`, `*.scheduler.ts`, `*.consumer.ts`, `*.listener.ts`, `*.worker.ts` have a sibling integration test | on |
| `1inch-testing/require-secondary-adapter-integration-test` | `*.repository.ts`, `*.client.ts`, `*.producer.ts` have a sibling integration test, anywhere; `*.service.ts` only under `/secondary/` | on |
| `1inch-testing/require-use-case-unit-test` | `*.use-case.ts` has a sibling unit test | on |
| `1inch-testing/require-cache-integration-test` | `*.cache.ts` has a sibling integration test | on |
| `1inch-testing/require-test-for-class-or-function` | every exported testable artifact (concrete class, function, arrow/function expression) has a sibling unit test; `.cache.ts` files may have an integration test instead | **off** |
| `1inch-testing/no-internal-overrides-in-integration-tests` | integration tests do not override internal implementation (`.overrideProvider(...)`, `.overrideGuard(...)`, `.overrideInterceptor(...)`, `.overridePipe(...)`, `.overrideFilter(...)`, `.useValue(...)`, `.useClass(...)`, `.useFactory(...)`, `.useExisting(...)` method calls are forbidden; provider-definition object properties like `{provide: X, useValue: Y}` remain allowed) | on |

### Rule options and defaults

Every rule accepts a single options object; the defaults are listed in the table below.

`pathIncludes` **narrows** a rule to part of a tree. It is a list of path fragments that must
ALL be present (AND semantics), matched against the file's path relative to the project root —
not its absolute path, so where the repository is checked out cannot change the result. The
enabled rules default to no fragments, meaning the artifact suffix alone decides. To scope a
rule to several alternative locations, add extra flat-config entries restricted via `files`.

| Rule | Option | Default |
|---|---|---|
| `require-controller-integration-test` | `pathIncludes` | `[]` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-secondary-adapter-integration-test` | `pathIncludes` | `[]`, except `*.service.ts` which requires `/secondary/` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-use-case-unit-test` | `pathIncludes` | `[]` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-cache-integration-test` | `pathIncludes` | `[]` |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| `require-test-for-class-or-function` | `pathIncludes` | `['/src/components/', '/core/']` (rule is off by default) |
| | `unitTestSuffix` | `'.test.ts'` |
| | `integrationTestSuffix` | `'.integration.test.ts'` |
| | `cacheFileSuffix` | `'.cache.ts'` |
| `no-internal-overrides-in-integration-tests` | `integrationTestSuffixes` | `['.integration.test.ts', '.integration.spec.ts']` |

Setting `pathIncludes` explicitly on `require-secondary-adapter-integration-test` replaces the
`*.service.ts` default too, so a repo that keeps its driven adapters somewhere other than
`secondary/` can say where.

### Why `*.service.ts` is treated differently

`.repository.ts`, `.client.ts`, `.producer.ts`, `.use-case.ts`, `.cache.ts` and the primary
adapter suffixes each name one kind of thing, so the suffix is enough to identify the artifact.
`.service.ts` does not: in a typical Nest app it names classes at every layer — core services,
application services, infra services. Treating all of them as driven adapters demands
integration tests for code that wants unit tests. Measured on aqua-api, removing the location
requirement for this one suffix accounts for 19 of 23 additional reports, none of which are
secondary adapters. It therefore keeps a `/secondary/` requirement, overridable via
`pathIncludes`.

### Why `require-test-for-class-or-function` is off by default

It is decided by the AST rather than a suffix, so it governs every exported class or function in
scope: bootstrap files, error types and DTOs included. Run without a path scope over aqua-api it
reports 280 files, so unlike the other rules it has no useful universal default and needs a scope
chosen per repo. Enable it with one:

```javascript
export default [
    ...oneInchEslintConfig,
    ...oneInchTestingConfig,
    {
        rules: {
            "1inch-testing/require-test-for-class-or-function": [
                "error",
                { pathIncludes: ["/src/components/", "/core/"] },
            ],
        },
    },
];
```

### Artifact naming is still a shared convention

The suffixes above are the vocabulary. A repo that names its use cases something other than
`*.use-case.ts`, or its cache adapters `*.storage.ts` rather than `*.cache.ts`, gets nothing from
the corresponding rule — no path configuration changes that.
`testing.layout-independence.test.mjs` pins down what is and is not covered, case by case,
against a layout that is not aqua-api's.

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
