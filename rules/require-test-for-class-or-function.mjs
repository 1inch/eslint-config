import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * ESLint rule: require-test-for-class-or-function
 *
 * Every source file that exports a testable artifact (concrete class, function,
 * arrow/function expression) must have a sibling unit-test file.
 * `.cache.ts` files may satisfy the requirement with an integration test instead.
 *
 * Ported from aqua-api `eslint-rules/require-test-for-class-or-function.mjs`.
 * The previously hardcoded conventions are configurable via options; the defaults
 * reproduce the aqua-api behavior exactly.
 */

const DEFAULT_OPTIONS = {
    pathIncludes: ['/src/components/', '/core/'],
    unitTestSuffix: '.test.ts',
    integrationTestSuffix: '.integration.test.ts',
    cacheFileSuffix: '.cache.ts'
}

function hasModuleDecorator(classDeclaration) {
    const decorators = classDeclaration.decorators ?? []

    return decorators.some(
        (decorator) =>
            decorator.expression.type === 'CallExpression' &&
            decorator.expression.callee.type === 'Identifier' &&
            decorator.expression.callee.name === 'Module'
    )
}

function hasNonPrivateConcreteMethod(classDeclaration) {
    const body = classDeclaration.body?.body ?? []

    return body.some(
        (member) =>
            member.type === 'MethodDefinition' &&
            member.value?.body !== null &&
            member.accessibility !== 'private'
    )
}

function isTestableDeclaration(declaration) {
    if (!declaration) return false

    if (declaration.type === 'FunctionDeclaration') return true

    if (declaration.type === 'VariableDeclaration') {
        return declaration.declarations.some((d) => {
            const initType = d.init?.type

            return initType === 'ArrowFunctionExpression' || initType === 'FunctionExpression'
        })
    }

    if (declaration.type === 'ClassDeclaration') {
        if (hasModuleDecorator(declaration)) return false
        if (!declaration.abstract) return true

        return hasNonPrivateConcreteMethod(declaration)
    }

    return false
}

export const requireTestForClassOrFunction = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require a sibling unit-test file for every exported testable class or function'
        },
        schema: [
            {
                type: 'object',
                properties: {
                    pathIncludes: {
                        type: 'array',
                        items: { type: 'string' },
                        description:
                            'Path fragments that must ALL be present in the filename for the rule to apply'
                    },
                    unitTestSuffix: { type: 'string' },
                    integrationTestSuffix: { type: 'string' },
                    cacheFileSuffix: { type: 'string' }
                },
                additionalProperties: false
            }
        ]
    },
    create(context) {
        const options = { ...DEFAULT_OPTIONS, ...(context.options[0] ?? {}) }
        const filename = context.filename ?? context.getFilename()

        if (!options.pathIncludes.every((fragment) => filename.includes(fragment))) return {}

        if (
            filename.endsWith(options.unitTestSuffix) ||
            filename.endsWith(options.integrationTestSuffix)
        ) {
            return {}
        }

        let needsTest = false
        let programNode = null

        return {
            Program(node) {
                programNode = node
            },

            ExportNamedDeclaration(node) {
                if (node.source) return
                if (!node.declaration) return
                if (isTestableDeclaration(node.declaration)) needsTest = true
            },

            ExportDefaultDeclaration(node) {
                if (isTestableDeclaration(node.declaration)) needsTest = true
            },

            'Program:exit'() {
                if (!needsTest) return

                const siblingTest = filename.replace(/\.ts$/, options.unitTestSuffix)
                const isCacheFile = filename.endsWith(options.cacheFileSuffix)
                const siblingIntegrationTest = filename.replace(/\.ts$/, options.integrationTestSuffix)

                if (existsSync(siblingTest)) return
                if (isCacheFile && existsSync(siblingIntegrationTest)) return

                const basename = path.basename(filename, '.ts')
                const expected = isCacheFile
                    ? `${basename}${options.unitTestSuffix} or ${basename}${options.integrationTestSuffix}`
                    : `${basename}${options.unitTestSuffix}`

                context.report({
                    node: programNode,
                    message: `Exported testable artifact requires a sibling test file. Missing: ${expected}`
                })
            }
        }
    }
}
