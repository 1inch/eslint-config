import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import testingConfig, { testingPlugin } from './testing.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXPECTED_RULES = [
    'require-test-for-class-or-function',
    'require-controller-integration-test',
    'require-secondary-adapter-integration-test',
    'require-use-case-unit-test',
    'require-cache-integration-test',
    'no-internal-overrides-in-integration-tests'
]

function fixturePath(...segments) {
    return path.join(__dirname, 'rules', '__fixtures__', ...segments)
}

async function lintFile(filePath, code) {
    const linter = new ESLint({
        overrideConfigFile: true,
        overrideConfig: [
            ...testingConfig,
            {
                files: ['**/*.ts'],
                languageOptions: { parser: tseslint.parser }
            }
        ]
    })
    const results = await linter.lintText(code, { filePath })

    return results[0].messages
}

function ruleIds(messages) {
    return messages.map((m) => m.ruleId)
}

describe('@1inch/eslint-config/testing preset', () => {
    it('exports a flat config array registering the 1inch-testing plugin', () => {
        expect(Array.isArray(testingConfig)).toBe(true)
        expect(testingConfig).toHaveLength(1)
        expect(testingConfig[0].plugins['1inch-testing']).toBe(testingPlugin)
    })

    it('enables all six rules at error severity', () => {
        const configuredRules = testingConfig[0].rules

        for (const rule of EXPECTED_RULES) {
            expect(configuredRules[`1inch-testing/${rule}`]).toBe('error')
        }

        expect(Object.keys(configuredRules)).toHaveLength(EXPECTED_RULES.length)
    })

    it('the plugin exposes exactly the six rules', () => {
        expect(Object.keys(testingPlugin.rules).sort()).toEqual([...EXPECTED_RULES].sort())
    })

    it('flags a use case without a unit test', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/core/use-cases/missing-test/get-foo.use-case.ts'
            ),
            'export class GetFooUseCase {}\n'
        )

        expect(ruleIds(messages)).toContain('1inch-testing/require-use-case-unit-test')
        expect(ruleIds(messages)).toContain('1inch-testing/require-test-for-class-or-function')
    })

    it('flags a controller without an integration test', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/controllers/missing-test/foo.controller.ts'
            ),
            'export class FooController {}\n'
        )

        expect(ruleIds(messages)).toContain('1inch-testing/require-controller-integration-test')
    })

    it('flags a secondary adapter without an integration test', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/secondary/missing-test/foo.repository.ts'
            ),
            'export class FooRepository {}\n'
        )

        expect(ruleIds(messages)).toContain('1inch-testing/require-secondary-adapter-integration-test')
    })

    it('flags a cache without an integration test', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/secondary/cache/missing-test/foo.cache.ts'
            ),
            'export class FooCache {}\n'
        )

        expect(ruleIds(messages)).toContain('1inch-testing/require-cache-integration-test')
    })

    it('flags internal overrides inside an integration test', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/controllers/has-test/foo.controller.integration.test.ts'
            ),
            'export const setup = (builder, Foo, fake) => builder.overrideProvider(Foo).useValue(fake)\n'
        )

        const overrideMessages = messages.filter(
            (m) => m.ruleId === '1inch-testing/no-internal-overrides-in-integration-tests'
        )

        expect(overrideMessages).toHaveLength(2)
    })

    it('reports nothing for an artifact whose tests exist', async () => {
        const messages = await lintFile(
            fixturePath(
                'require-integration-test',
                'src/components/foo/core/use-cases/has-test/get-foo.use-case.ts'
            ),
            'export class GetFooUseCase {}\n'
        )

        expect(messages).toEqual([])
    })
})
