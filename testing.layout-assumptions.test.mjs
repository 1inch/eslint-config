import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import testingConfig, { testingPlugin } from './testing.mjs'
import { createFixtureRoot, writeFixtureFiles, removeFixtureRoot } from './test-utils.mjs'

/**
 * The default `pathIncludes` of every scoped rule in the preset describe ONE
 * layout: aqua-api's `src/components/<component>/{controllers,core,secondary}/`.
 * A rule examines a file only when EVERY fragment of its `pathIncludes` appears
 * in the path, so on a service that arranges its folders differently the rules
 * do not misfire — they go quiet, and the repo gets a green lint run that proves
 * nothing.
 *
 * These cases pin that behaviour down against a real consumer, charts-api
 * (`@1inch/charts`), which is hexagonal but nests its layers as
 * `src/app/api/`, `src/modules/core/` and `src/modules/secondary/`. With the
 * defaults, only the two `/secondary/` services are ever looked at; with
 * `pathIncludes` matched to the layout, the same tree reports six problems.
 *
 * The expectations here document the CURRENT defaults rather than the desired
 * ones. Every `toEqual([])` on an artifact file is a gap, not a guarantee to
 * preserve: if a later change starts reporting those files, update the
 * expectation, do not restore the silence.
 */

const fixtureRoot = createFixtureRoot('testing-layout-assumptions-')

// charts-api's tree, trimmed to the artifact files. `api.controller.spec.ts`
// and `quantor-api.service.spec.ts` exist there and are deliberately included:
// the repo tests those units, just not under the names the preset looks for.
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

// The same layout expressed through the documented options. charts-api has no
// `/controllers/` folder at all, so the `.controller.ts` suffix does the
// filtering and the path fragment only keeps the rule inside `src/`.
const CHARTS_API_PATH_INCLUDES = {
    'require-test-for-class-or-function': ['/modules/core/'],
    'require-controller-integration-test': ['/src/'],
    'require-secondary-adapter-integration-test': ['/modules/secondary/'],
    'require-use-case-unit-test': ['/modules/core/'],
    'require-cache-integration-test': ['/modules/secondary/storage/']
}

const chartsApiConfig = [
    {
        plugins: { '1inch-testing': testingPlugin },
        rules: Object.fromEntries(
            Object.entries(CHARTS_API_PATH_INCLUDES).map(([rule, pathIncludes]) => [
                `1inch-testing/${rule}`,
                ['error', { pathIncludes }]
            ])
        )
    }
]

beforeAll(() => writeFixtureFiles(fixtureRoot, FIXTURE_FILES))
afterAll(() => removeFixtureRoot(fixtureRoot))

function fixturePath(relativePath) {
    return path.join(fixtureRoot, relativePath)
}

async function lintFile(relativePath, code, config = testingConfig) {
    const linter = new ESLint({
        cwd: fixtureRoot,
        overrideConfigFile: true,
        overrideConfig: [
            ...config,
            {
                files: ['**/*.ts'],
                languageOptions: { parser: tseslint.parser }
            }
        ]
    })
    const results = await linter.lintText(code, { filePath: fixturePath(relativePath) })

    return results[0].messages
}

function ruleIds(messages) {
    return messages.map((m) => m.ruleId)
}

describe('testing preset defaults against a non-aqua layout', () => {
    it('reports the secondary services — the only artifacts the defaults reach', async () => {
        const quantor = await lintFile(
            'src/modules/secondary/api/quantor/quantor-api.service.ts',
            'export class QuantorApiService {}\n'
        )
        const healthcheck = await lintFile(
            'src/modules/secondary/healthcheck/healthcheck.service.ts',
            'export class HealthCheckService {}\n'
        )

        expect(ruleIds(quantor)).toEqual(['1inch-testing/require-secondary-adapter-integration-test'])
        expect(ruleIds(healthcheck)).toEqual([
            '1inch-testing/require-secondary-adapter-integration-test'
        ])
    })

    it('asks for an integration test even where a unit test already exists', async () => {
        // quantor-api.service.spec.ts sits next to the file. The rule wants
        // `.integration.test.ts`, so the existing suite does not register at all
        // — the suffix options exist for exactly this, and are also layout-bound.
        const messages = await lintFile(
            'src/modules/secondary/api/quantor/quantor-api.service.ts',
            'export class QuantorApiService {}\n'
        )

        expect(ruleIds(messages)).toContain(
            '1inch-testing/require-secondary-adapter-integration-test'
        )
    })

    it('never examines a *.controller.ts that lives outside /controllers/', async () => {
        const appController = await lintFile(
            'src/app/api/api.controller.ts',
            'export class ApiController {}\n'
        )
        // This one is under /secondary/, so it IS in scope for the secondary
        // rule — which does not govern the .controller.ts suffix. In scope for
        // the wrong rule reads the same as out of scope: nothing is reported.
        const healthcheckController = await lintFile(
            'src/modules/secondary/healthcheck/healthcheck.controller.ts',
            'export class HealthCheckController {}\n'
        )

        expect(appController).toEqual([])
        expect(healthcheckController).toEqual([])
    })

    it('never examines a *.cache.ts that lives outside /src/components/', async () => {
        const messages = await lintFile(
            'src/modules/secondary/storage/base.cache.ts',
            'export abstract class BaseCache {\n    public async get() {}\n}\n'
        )

        expect(messages).toEqual([])
    })

    it('never examines the core layer, because two fragments must match at once', async () => {
        // `require-test-for-class-or-function` needs '/src/components/' AND
        // '/core/'. charts-api's core is `src/modules/core/`, which supplies the
        // second fragment and never the first, so the rule cannot fire anywhere
        // in the repo. `require-use-case-unit-test` does reach these files, but
        // only governs the `.use-case.ts` suffix, which charts-api does not use.
        const messages = await lintFile(
            'src/modules/core/charts/charts.service.ts',
            'export class ChartsService {}\n'
        )

        expect(messages).toEqual([])
    })

    it('never examines a *.service.ts outside /secondary/, wherever it sits', async () => {
        const messages = await lintFile('src/app/api/api.service.ts', 'export class ApiService {}\n')

        expect(messages).toEqual([])
    })

    it('has no artifact suffix for the concrete cache adapters', async () => {
        // The classes that actually talk to Redis are `*.storage.ts`. No rule
        // owns that suffix, so path scoping is not the only assumption baked in
        // — the artifact vocabulary is aqua-api's too.
        const messages = await lintFile(
            'src/modules/secondary/storage/candles/candles.storage.ts',
            'export class CandlesStorage {}\n'
        )

        expect(messages).toEqual([])
    })
})

describe('testing preset with pathIncludes matched to the layout', () => {
    it('reports both controllers once the path scope admits them', async () => {
        const appController = await lintFile(
            'src/app/api/api.controller.ts',
            'export class ApiController {}\n',
            chartsApiConfig
        )
        const healthcheckController = await lintFile(
            'src/modules/secondary/healthcheck/healthcheck.controller.ts',
            'export class HealthCheckController {}\n',
            chartsApiConfig
        )

        expect(ruleIds(appController)).toEqual([
            '1inch-testing/require-controller-integration-test'
        ])
        expect(ruleIds(healthcheckController)).toEqual([
            '1inch-testing/require-controller-integration-test'
        ])
    })

    it('reports the cache once the path scope admits it', async () => {
        const messages = await lintFile(
            'src/modules/secondary/storage/base.cache.ts',
            'export abstract class BaseCache {\n    public async get() {}\n}\n',
            chartsApiConfig
        )

        expect(ruleIds(messages)).toEqual(['1inch-testing/require-cache-integration-test'])
    })

    it('reports the core service once a single fragment is used', async () => {
        const messages = await lintFile(
            'src/modules/core/charts/charts.service.ts',
            'export class ChartsService {}\n',
            chartsApiConfig
        )

        expect(ruleIds(messages)).toEqual(['1inch-testing/require-test-for-class-or-function'])
    })

    it('keeps reporting the secondary services', async () => {
        const quantor = await lintFile(
            'src/modules/secondary/api/quantor/quantor-api.service.ts',
            'export class QuantorApiService {}\n',
            chartsApiConfig
        )
        const healthcheck = await lintFile(
            'src/modules/secondary/healthcheck/healthcheck.service.ts',
            'export class HealthCheckService {}\n',
            chartsApiConfig
        )

        expect(ruleIds(quantor)).toEqual(['1inch-testing/require-secondary-adapter-integration-test'])
        expect(ruleIds(healthcheck)).toEqual([
            '1inch-testing/require-secondary-adapter-integration-test'
        ])
    })
})
