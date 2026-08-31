import { existsSync } from 'node:fs'
import path from 'node:path'
import { scopePath, matchesPathIncludes, contextCwd } from './path-scope.mjs'

/**
 * ESLint rules: require-controller-integration-test, require-secondary-adapter-integration-test,
 * require-use-case-unit-test, require-cache-integration-test
 *
 * Each rule requires a sibling test file (integration or unit) for a family of
 * architectural artifacts, identified by filename suffix.
 *
 * The artifact suffix is what identifies the artifact, so by default these rules
 * apply wherever the file lives: a `.controller.ts` needs a controller integration
 * test whether it sits in `controllers/`, `app/api/` or anywhere else. `pathIncludes`
 * is available to NARROW a rule to part of a tree, but nothing has to be configured
 * for the rules to see a repository's artifacts.
 *
 * The one exception is `.service.ts` — see SECONDARY_ADAPTER_ARTIFACTS.
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
    // `.service.ts` is the only suffix here that does not identify a layer. In a
    // typical Nest app it names classes everywhere — core services, infra
    // services, application services — so treating every one as a driven adapter
    // demands integration tests for code that wants unit tests. Measured against
    // aqua-api, dropping the location requirement for this suffix alone accounts
    // for 19 of 23 new reports, none of them secondary adapters. It therefore
    // keeps a location requirement while the unambiguous suffixes above do not.
    //
    // An explicit `pathIncludes` in the rule options replaces this default, so a
    // repo that keeps its adapters somewhere else can still say so.
    {
        suffix: '.service.ts',
        testKind: 'integration',
        type: 'Service',
        pathIncludes: ['/secondary/']
    }
]

const USE_CASE_ARTIFACTS = [{ suffix: '.use-case.ts', testKind: 'unit', type: 'UseCase' }]

const CACHE_ARTIFACTS = [{ suffix: '.cache.ts', testKind: 'integration', type: 'Cache' }]

function createRule(artifacts, defaultPathIncludes = []) {
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
            const scopedPath = scopePath(filename, contextCwd(context))
            // A configured scope is authoritative: it replaces both the rule
            // default and any per-artifact default below.
            const scopeIsConfigured = context.options[0]?.pathIncludes !== undefined

            if (!matchesPathIncludes(scopedPath, options.pathIncludes)) {
                return {}
            }

            for (const artifact of artifacts) {
                if (
                    !scopeIsConfigured &&
                    artifact.pathIncludes &&
                    !matchesPathIncludes(scopedPath, artifact.pathIncludes)
                ) {
                    continue
                }

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

// No default path scope: the suffix identifies the artifact, so these apply
// wherever it lives. `pathIncludes` narrows them when a repo wants that.
export const requireControllerIntegrationTest = createRule(CONTROLLER_ARTIFACTS)

export const requireSecondaryAdapterIntegrationTest = createRule(SECONDARY_ADAPTER_ARTIFACTS)

export const requireUseCaseUnitTest = createRule(USE_CASE_ARTIFACTS)

export const requireCacheIntegrationTest = createRule(CACHE_ARTIFACTS)
