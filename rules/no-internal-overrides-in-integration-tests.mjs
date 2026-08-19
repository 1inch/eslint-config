/**
 * ESLint rule: no-internal-overrides-in-integration-tests
 *
 * Forbids any form of internal-implementation override inside integration-test files.
 *
 * Banned method calls (only when used as method calls, NOT as object properties in provider
 * definitions like `{provide: X, useValue: Y}`):
 *   - `.overrideProvider(...)`  (NestJS TestingModule)
 *   - `.overrideGuard(...)`
 *   - `.overrideInterceptor(...)`
 *   - `.overridePipe(...)`
 *   - `.overrideFilter(...)`
 *   - `.useValue(...)`          (only when chained after an override above)
 *   - `.useClass(...)`          (only when chained after an override above)
 *   - `.useFactory(...)`        (only when chained after an override above)
 *   - `.useExisting(...)`       (only when chained after an override above)
 *
 * Rationale (ALSO shown in every error message so it is visible at the violation site):
 *
 * In integration tests we DO NOT override internal implementation. We only swap the external
 * global config. We use the code AS-IS, exactly like in production. We run the real
 * infrastructure in TestContainers (Postgres, Kafka, Redis, ...) or stand up a real HTTP
 * server and redirect calls via config. The whole code path must behave as if it were running
 * in production. That is what integration tests are for.
 *
 * If you need to assert on mocked behavior (e.g. metric calls, logger calls), write a UNIT
 * test instead (`*.test.ts`). Unit tests are allowed to mock freely.
 *
 * The integration-test filename suffixes are configurable via options.
 */

const DEFAULT_OPTIONS = {
    integrationTestSuffixes: ['.integration.test.ts', '.integration.spec.ts']
}

const BANNED_METHODS = new Set([
    'overrideProvider',
    'overrideGuard',
    'overrideInterceptor',
    'overridePipe',
    'overrideFilter',
    'useValue',
    'useClass',
    'useFactory',
    'useExisting'
])

const RATIONALE =
    'In integration tests we do NOT override internal implementation. ' +
    'We only swap the external global config. We use the code AS-IS, exactly like in production. ' +
    'Infrastructure runs in TestContainers (Postgres, Kafka, Redis, ...) or behind a real HTTP server ' +
    'that we point the code at via config. If you need to mock internals, write a unit test (*.test.ts) instead.'

export const noInternalOverridesInIntegrationTests = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Forbid .overrideProvider / .useValue / .useClass / .useFactory inside integration-test files'
        },
        schema: [
            {
                type: 'object',
                properties: {
                    integrationTestSuffixes: {
                        type: 'array',
                        items: { type: 'string' },
                        description:
                            'Filename suffixes identifying integration-test files (ANY match applies the rule)'
                    }
                },
                additionalProperties: false
            }
        ]
    },
    create(context) {
        const options = { ...DEFAULT_OPTIONS, ...(context.options[0] ?? {}) }
        const filename = context.filename || context.getFilename()

        if (!options.integrationTestSuffixes.some((suffix) => filename.endsWith(suffix))) {
            return {}
        }

        return {
            CallExpression(node) {
                if (node.callee.type !== 'MemberExpression') {
                    return
                }

                const prop = node.callee.property

                if (!prop || prop.type !== 'Identifier') {
                    return
                }

                if (!BANNED_METHODS.has(prop.name)) {
                    return
                }

                context.report({
                    node,
                    message: `'.${prop.name}(...)' is forbidden in integration tests. ${RATIONALE}`
                })
            }
        }
    }
}
