import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * ESLint rules: require-controller-integration-test, require-secondary-adapter-integration-test,
 * require-use-case-unit-test, require-cache-integration-test
 *
 * Each rule requires a sibling test file (integration or unit) for a family of
 * architectural artifacts, identified by filename suffix and path scoping.
 *
 * Ported from aqua-api `eslint-rules/require-integration-test.mjs`.
 * The previously hardcoded conventions are configurable via options; the defaults
 * reproduce the aqua-api behavior exactly. The artifact suffixes themselves
 * (`.controller.ts`, `.repository.ts`, ...) define what each rule is about and stay fixed.
 */

const DEFAULT_SUFFIXES = {
    unitTestSuffix: '.test.ts',
    integrationTestSuffix: '.integration.test.ts'
}

const OPTIONS_SCHEMA = {
    type: 'object',
    properties: {
        pathIncludes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Path fragments that must ALL be present in the filename for the rule to apply'
        },
        unitTestSuffix: { type: 'string' },
        integrationTestSuffix: { type: 'string' }
    },
    additionalProperties: false
}

const CONTROLLER_ARTIFACTS = [
    { suffix: '.controller.ts', testKind: 'integration', type: 'Controller' },
    { suffix: '.scheduler.ts', testKind: 'integration', type: 'Scheduler' },
    { suffix: '.consumer.ts', testKind: 'integration', type: 'Consumer' },
    { suffix: '.listener.ts', testKind: 'integration', type: 'Listener' },
    { suffix: '.worker.ts', testKind: 'integration', type: 'Worker' }
]

const SECONDARY_ADAPTER_ARTIFACTS = [
    { suffix: '.repository.ts', testKind: 'integration', type: 'Repository' },
    { suffix: '.client.ts', testKind: 'integration', type: 'Client' },
    { suffix: '.producer.ts', testKind: 'integration', type: 'Producer' },
    { suffix: '.service.ts', testKind: 'integration', type: 'Service' }
]

const USE_CASE_ARTIFACTS = [{ suffix: '.use-case.ts', testKind: 'unit', type: 'UseCase' }]

const CACHE_ARTIFACTS = [{ suffix: '.cache.ts', testKind: 'integration', type: 'Cache' }]

function createRule(artifacts, defaultPathIncludes) {
    return {
        meta: {
            type: 'problem',
            docs: {
                description: 'Require integration/unit test files for adapters and use cases'
            },
            schema: [OPTIONS_SCHEMA]
        },
        create(context) {
            const options = {
                pathIncludes: defaultPathIncludes,
                ...DEFAULT_SUFFIXES,
                ...(context.options[0] ?? {})
            }
            const filename = context.filename || context.getFilename()

            if (!options.pathIncludes.every((fragment) => filename.includes(fragment))) {
                return {}
            }

            for (const artifact of artifacts) {
                if (
                    filename.endsWith(artifact.suffix) &&
                    !filename.includes(options.unitTestSuffix) &&
                    !filename.includes(options.integrationTestSuffix) &&
                    !filename.endsWith('.module.ts')
                ) {
                    const testSuffix =
                        artifact.testKind === 'integration'
                            ? options.integrationTestSuffix
                            : options.unitTestSuffix
                    const testFile = filename.replace(/\.ts$/, testSuffix)

                    if (!existsSync(testFile)) {
                        const relativePath = path.relative(process.cwd(), testFile)

                        return {
                            Program(node) {
                                context.report({
                                    node,
                                    message: `${artifact.type} must have ${artifact.testKind} test. Missing: ${relativePath}`
                                })
                            }
                        }
                    }
                }
            }

            return {}
        }
    }
}

export const requireControllerIntegrationTest = createRule(CONTROLLER_ARTIFACTS, ['/controllers/'])

export const requireSecondaryAdapterIntegrationTest = createRule(SECONDARY_ADAPTER_ARTIFACTS, [
    '/secondary/'
])

export const requireUseCaseUnitTest = createRule(USE_CASE_ARTIFACTS, ['/core/'])

export const requireCacheIntegrationTest = createRule(CACHE_ARTIFACTS, ['/src/components/'])
