import { it, describe } from 'vitest'
import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireTestForClassOrFunction } from './require-test-for-class-or-function.mjs'

RuleTester.it = it
RuleTester.describe = describe
RuleTester.itOnly = it.only

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureBase = path.join(
    __dirname,
    '__fixtures__',
    'require-test-for-class-or-function',
    'src',
    'components',
    'foo',
    'core',
    'services'
)

const hasTestFile = path.join(fixtureBase, 'has-test', 'thing.ts')
const hasSpecFile = path.join(fixtureBase, 'has-spec', 'thing.ts')
const missingTestFile = path.join(fixtureBase, 'missing-test', 'thing.ts')
const cacheWithIntegrationTestFile = path.join(fixtureBase, 'cache-with-integration-test', 'thing.cache.ts')

const abstractWithConcreteMethodFile = path.join(
    __dirname,
    '__fixtures__',
    'require-test-for-class-or-function',
    'src',
    'components',
    'foo',
    'core',
    'domain',
    'widget',
    'widget.ts'
)

const ruleTester = new RuleTester({
    languageOptions: { parser: tseslint.parser }
})

ruleTester.run('require-test-for-class-or-function', requireTestForClassOrFunction, {
    valid: [
        {
            code: 'export type Foo = number',
            filename: missingTestFile
        },
        {
            code: 'export interface Foo { x: number }',
            filename: missingTestFile
        },
        {
            code: 'export enum Foo { A, B }',
            filename: missingTestFile
        },
        {
            code: 'export abstract class Foo { abstract foo(): void }',
            filename: missingTestFile
        },
        {
            code: '@Module() export class Foo {}',
            filename: missingTestFile
        },
        {
            code: 'export class Thing {}',
            filename: hasTestFile
        },
        // file outside the default path scoping is not governed
        {
            code: 'export class Thing {}',
            filename: '/virtual/lib/thing.ts'
        },
        // cache file satisfied by an integration test sibling
        {
            code: 'export class ThingCache {}',
            filename: cacheWithIntegrationTestFile
        },
        // custom unit-test suffix: sibling thing.spec.ts exists
        {
            code: 'export class Thing {}',
            filename: hasSpecFile,
            options: [{ unitTestSuffix: '.spec.ts' }]
        },
        // custom path scoping excludes the default location
        {
            code: 'export class Thing {}',
            filename: missingTestFile,
            options: [{ pathIncludes: ['/somewhere-else/'] }]
        }
    ],
    invalid: [
        {
            code: 'export class Thing {}',
            filename: missingTestFile,
            errors: [{ message: /Missing: thing\.test\.ts/ }]
        },
        {
            code: 'export const doIt = () => {}',
            filename: missingTestFile,
            errors: [{ message: /Missing: thing\.test\.ts/ }]
        },
        {
            code: 'export abstract class Foo { abstract a(): void; public b(): void { console.log(1) } }',
            filename: missingTestFile,
            errors: [{ message: /Missing: thing\.test\.ts/ }]
        },
        {
            filename: abstractWithConcreteMethodFile,
            code: `export abstract class Widget {
  abstract render(): void
  public describe(): string {
    return 'widget'
  }
}`,
            errors: [{ message: /Missing: widget\.test\.ts/ }]
        },
        // cache file missing both unit and integration test siblings
        {
            code: 'export class ThingCache {}',
            filename: '/virtual/src/components/foo/core/services/thing.cache.ts',
            errors: [{ message: /Missing: thing\.cache\.test\.ts or thing\.cache\.integration\.test\.ts/ }]
        },
        // custom unit-test suffix: thing.spec.ts is missing
        {
            code: 'export class Thing {}',
            filename: missingTestFile,
            options: [{ unitTestSuffix: '.spec.ts' }],
            errors: [{ message: /Missing: thing\.spec\.ts/ }]
        },
        // custom path scoping governs a non-default location
        {
            code: 'export class Thing {}',
            filename: '/virtual/src/modules/foo/domain/thing.ts',
            options: [{ pathIncludes: ['/src/modules/'] }],
            errors: [{ message: /Missing: thing\.test\.ts/ }]
        }
    ]
})
