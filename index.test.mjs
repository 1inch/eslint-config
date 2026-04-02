import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import config from './index.mjs'

function createLinter() {
    return new ESLint({
        overrideConfigFile: true,
        overrideConfig: config
    })
}

async function lintText(code, filePath = 'src/test.ts') {
    const linter = createLinter()
    const results = await linter.lintText(code, { filePath })

    return results[0].messages
}

function hasRule(messages, ruleId) {
    return messages.some((m) => m.ruleId === ruleId)
}

describe('@1inch/eslint-config', () => {
    it('exports a valid config array', () => {
        expect(Array.isArray(config)).toBe(true)
        expect(config.length).toBeGreaterThan(0)
    })

    it('catches console.log (no-console)', async () => {
        const messages = await lintText('console.log("hello")\n')
        expect(hasRule(messages, 'no-console')).toBe(true)
    })

    it('catches missing return type (@typescript-eslint/explicit-function-return-type)', async () => {
        const messages = await lintText('export function foo() { return 1 }\n')
        expect(hasRule(messages, '@typescript-eslint/explicit-function-return-type')).toBe(true)
    })

    it('catches unused imports (unused-imports/no-unused-imports)', async () => {
        const code = 'import { readFile } from "fs"\nexport const x: number = 1\n'
        const messages = await lintText(code)
        expect(hasRule(messages, 'unused-imports/no-unused-imports')).toBe(true)
    })

    it('catches formatting issues via prettier (prettier/prettier)', async () => {
        const code = 'export const arr: number[] = [1, 2, 3,]\n'
        const messages = await lintText(code)
        expect(hasRule(messages, 'prettier/prettier')).toBe(true)
    })

    it('allows valid code without errors for key rules', async () => {
        const code = `export function add(a: number, b: number): number {
    return a + b
}
`
        const messages = await lintText(code)
        const criticalRules = [
            'no-console',
            '@typescript-eslint/explicit-function-return-type',
            'unused-imports/no-unused-imports'
        ]
        for (const rule of criticalRules) {
            expect(hasRule(messages, rule)).toBe(false)
        }
    })
})
