import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import testingConfig from './testing.mjs'
import { createFixtureRoot, writeFixtureFiles, removeFixtureRoot } from './test-utils.mjs'

/**
 * The preset used to default every scoped rule to aqua-api's folder layout
 * (`src/components/<component>/{controllers,core,secondary}/`). Fragments are
 * ANDed, so on a service that arranges its layers differently the rules did not
 * misfire — they stopped examining files, and the repo got a green run that
 * proved nothing. charts-api reported 2 problems where it should have reported 5.
 *
 * These cases lint a tree mirroring charts-api's layout (`src/app/api/`,
 * `src/modules/core/`, `src/modules/secondary/`) with NO configuration, and pin
 * down that its artifacts are now seen. They also pin the two deliberate
 * carve-outs, so neither is quietly widened later.
 */

const fixtureRoot = createFixtureRoot('testing-layout-independence-')

// charts-api's tree, trimmed to the artifact files. The two `.spec.ts` files
// exist there: the repo tests those units, just not under the names the preset
// looks for, which is what the suffix options are for.
const FIXTURE_FILES = [
    'src/app/api/api.controller.ts',
    'src/app/api/api.controller.spec.ts',
    'src/app/api/api.service.ts',
    'src/modules/core/charts/charts.service.ts',
    'src/modules/secondary/api/quantor/quantor-api.service.ts',
    'src/modules/secondary/api/quantor/quantor-api.service.spec.ts',
    'src/modules/secondary/healthcheck/healthcheck.controller.ts',
    'src/modules/secondary/healthcheck/healthcheck.service.ts',
    'src/modules/secondary/storage/base.cache.ts',
    'src/modules/secondary/storage/candles/candles.storage.ts'
]

beforeAll(() => writeFixtureFiles(fixtureRoot, FIXTURE_FILES))
afterAll(() => removeFixtureRoot(fixtureRoot))

async function lintFile(relativePath, code) {
    const linter = new ESLint({
        cwd: fixtureRoot,
        overrideConfigFile: true,
        overrideConfig: [
            ...testingConfig,
            {
                files: ['**/*.ts'],
                languageOptions: { parser: tseslint.parser }
            }
        ]
    })
    const results = await linter.lintText(code, {
        filePath: path.join(fixtureRoot, relativePath)
    })

    return results[0].messages.map((m) => m.ruleId)
}

describe('testing preset on a layout that is not aqua-api, unconfigured', () => {
    it('reports a controller in src/app/api/', async () => {
        expect(await lintFile('src/app/api/api.controller.ts', 'export class ApiController {}\n')).toEqual(
            ['1inch-testing/require-controller-integration-test']
        )
    })

    it('reports a controller nested under secondary/', async () => {
        // Previously invisible twice over: no /controllers/ folder for the
        // controller rule, and the secondary rule that did have it in scope does
        // not govern the .controller.ts suffix.
        expect(
            await lintFile(
                'src/modules/secondary/healthcheck/healthcheck.controller.ts',
                'export class HealthCheckController {}\n'
            )
        ).toEqual(['1inch-testing/require-controller-integration-test'])
    })

    it('reports a cache outside a components tree', async () => {
        expect(
            await lintFile(
                'src/modules/secondary/storage/base.cache.ts',
                'export abstract class BaseCache {\n    public async get() {}\n}\n'
            )
        ).toEqual(['1inch-testing/require-cache-integration-test'])
    })

    it('reports secondary services, and wants an integration test beside the unit test', async () => {
        // quantor-api.service.spec.ts sits next to this file; the rule asks for
        // `.integration.test.ts`, which is a naming question the suffix options
        // answer, not a scoping one.
        expect(
            await lintFile(
                'src/modules/secondary/api/quantor/quantor-api.service.ts',
                'export class QuantorApiService {}\n'
            )
        ).toEqual(['1inch-testing/require-secondary-adapter-integration-test'])

        expect(
            await lintFile(
                'src/modules/secondary/healthcheck/healthcheck.service.ts',
                'export class HealthCheckService {}\n'
            )
        ).toEqual(['1inch-testing/require-secondary-adapter-integration-test'])
    })
})

describe('deliberate carve-outs', () => {
    it('leaves a *.service.ts alone outside secondary/', async () => {
        // `.service.ts` names classes at every layer, so it keeps a location
        // requirement. Demanding an integration test for an application or core
        // service is the wrong ask: measured on aqua-api, dropping this
        // requirement produces 19 such reports and no real adapters.
        expect(await lintFile('src/app/api/api.service.ts', 'export class ApiService {}\n')).toEqual([])

        expect(
            await lintFile('src/modules/core/charts/charts.service.ts', 'export class ChartsService {}\n')
        ).toEqual([])
    })

    it('has no artifact suffix for the concrete cache adapters', async () => {
        // The classes that actually talk to Redis here are `*.storage.ts`. No
        // rule owns that suffix, so the artifact vocabulary remains a convention
        // a repo has to share to benefit from these rules.
        expect(
            await lintFile(
                'src/modules/secondary/storage/candles/candles.storage.ts',
                'export class CandlesStorage {}\n'
            )
        ).toEqual([])
    })

    it('does not enable require-test-for-class-or-function', async () => {
        // charts.service.ts exports a concrete class with no sibling test, so the
        // rule would report it — but it is off by default because it needs a
        // repo-specific scope (unscoped it reports 280 files in aqua-api).
        expect(
            await lintFile('src/modules/core/charts/charts.service.ts', 'export class ChartsService {}\n')
        ).not.toContain('1inch-testing/require-test-for-class-or-function')
    })
})
