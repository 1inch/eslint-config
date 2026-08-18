import { it, describe } from 'vitest'
import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    requireControllerIntegrationTest,
    requireSecondaryAdapterIntegrationTest,
    requireUseCaseUnitTest,
    requireCacheIntegrationTest
} from './require-integration-test.mjs'

RuleTester.it = it
RuleTester.describe = describe
RuleTester.itOnly = it.only

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureBase = path.join(
    __dirname,
    '__fixtures__',
    'require-integration-test',
    'src',
    'components',
    'foo'
)
const specNamingBase = path.join(
    __dirname,
    '__fixtures__',
    'require-integration-test',
    'spec-naming',
    'src',
    'components',
    'foo'
)

const ruleTester = new RuleTester({
    languageOptions: { parser: tseslint.parser }
})

ruleTester.run('require-controller-integration-test', requireControllerIntegrationTest, {
    valid: [
        // integration test sibling exists
        {
            code: 'export class FooController {}',
            filename: path.join(fixtureBase, 'controllers', 'has-test', 'foo.controller.ts')
        },
        // outside /controllers/ the rule does not apply
        {
            code: 'export class FooController {}',
            filename: '/virtual/app/foo.controller.ts'
        },
        // non-artifact files under /controllers/ are not governed
        {
            code: 'export const helper = 1',
            filename: '/virtual/app/controllers/helpers.ts'
        },
        // custom path scoping excludes the default location
        {
            code: 'export class FooController {}',
            filename: path.join(fixtureBase, 'controllers', 'missing-test', 'foo.controller.ts'),
            options: [{ pathIncludes: ['/somewhere-else/'] }]
        },
        // custom integration-test suffix: sibling .integration.spec.ts exists
        {
            code: 'export class FooController {}',
            filename: path.join(specNamingBase, 'controllers', 'has-spec', 'foo.controller.ts'),
            options: [{ integrationTestSuffix: '.integration.spec.ts' }]
        }
    ],
    invalid: [
        {
            code: 'export class FooController {}',
            filename: path.join(fixtureBase, 'controllers', 'missing-test', 'foo.controller.ts'),
            errors: [
                { message: /Controller must have integration test\. Missing: .*foo\.controller\.integration\.test\.ts/ }
            ]
        },
        {
            code: 'export class JobsScheduler {}',
            filename: '/virtual/app/controllers/jobs.scheduler.ts',
            errors: [{ message: /Scheduler must have integration test\. Missing: .*jobs\.scheduler\.integration\.test\.ts/ }]
        },
        {
            code: 'export class EventsConsumer {}',
            filename: '/virtual/app/controllers/events.consumer.ts',
            errors: [{ message: /Consumer must have integration test\. Missing: .*events\.consumer\.integration\.test\.ts/ }]
        },
        {
            code: 'export class BlockListener {}',
            filename: '/virtual/app/controllers/block.listener.ts',
            errors: [{ message: /Listener must have integration test\. Missing: .*block\.listener\.integration\.test\.ts/ }]
        },
        {
            code: 'export class SyncWorker {}',
            filename: '/virtual/app/controllers/sync.worker.ts',
            errors: [{ message: /Worker must have integration test\. Missing: .*sync\.worker\.integration\.test\.ts/ }]
        },
        // custom integration-test suffix changes the expected sibling
        {
            code: 'export class BarController {}',
            filename: '/virtual/app/controllers/bar.controller.ts',
            options: [{ integrationTestSuffix: '.integration.spec.ts' }],
            errors: [{ message: /Controller must have integration test\. Missing: .*bar\.controller\.integration\.spec\.ts/ }]
        },
        // custom path scoping governs a non-default location
        {
            code: 'export class BazController {}',
            filename: '/virtual/app/primary/baz.controller.ts',
            options: [{ pathIncludes: ['/primary/'] }],
            errors: [{ message: /Controller must have integration test\. Missing: .*baz\.controller\.integration\.test\.ts/ }]
        }
    ]
})

ruleTester.run('require-secondary-adapter-integration-test', requireSecondaryAdapterIntegrationTest, {
    valid: [
        {
            code: 'export class FooRepository {}',
            filename: path.join(fixtureBase, 'secondary', 'has-test', 'foo.repository.ts')
        },
        // outside /secondary/ the rule does not apply
        {
            code: 'export class FooRepository {}',
            filename: '/virtual/app/foo.repository.ts'
        }
    ],
    invalid: [
        {
            code: 'export class FooRepository {}',
            filename: path.join(fixtureBase, 'secondary', 'missing-test', 'foo.repository.ts'),
            errors: [
                { message: /Repository must have integration test\. Missing: .*foo\.repository\.integration\.test\.ts/ }
            ]
        },
        {
            code: 'export class RateClient {}',
            filename: '/virtual/app/secondary/rate.client.ts',
            errors: [{ message: /Client must have integration test\. Missing: .*rate\.client\.integration\.test\.ts/ }]
        },
        {
            code: 'export class EventsProducer {}',
            filename: '/virtual/app/secondary/events.producer.ts',
            errors: [{ message: /Producer must have integration test\. Missing: .*events\.producer\.integration\.test\.ts/ }]
        },
        {
            code: 'export class PriceService {}',
            filename: '/virtual/app/secondary/price.service.ts',
            errors: [{ message: /Service must have integration test\. Missing: .*price\.service\.integration\.test\.ts/ }]
        }
    ]
})

ruleTester.run('require-use-case-unit-test', requireUseCaseUnitTest, {
    valid: [
        {
            code: 'export class GetFooUseCase {}',
            filename: path.join(fixtureBase, 'core', 'use-cases', 'has-test', 'get-foo.use-case.ts')
        },
        // outside /core/ the rule does not apply
        {
            code: 'export class GetFooUseCase {}',
            filename: '/virtual/app/get-foo.use-case.ts'
        },
        // non-use-case files under /core/ are not governed
        {
            code: 'export const helper = 1',
            filename: '/virtual/app/core/helpers.ts'
        }
    ],
    invalid: [
        {
            code: 'export class GetFooUseCase {}',
            filename: path.join(fixtureBase, 'core', 'use-cases', 'missing-test', 'get-foo.use-case.ts'),
            errors: [{ message: /UseCase must have unit test\. Missing: .*get-foo\.use-case\.test\.ts/ }]
        },
        // custom unit-test suffix changes the expected sibling
        {
            code: 'export class GetBarUseCase {}',
            filename: '/virtual/app/core/get-bar.use-case.ts',
            options: [{ unitTestSuffix: '.spec.ts' }],
            errors: [{ message: /UseCase must have unit test\. Missing: .*get-bar\.use-case\.spec\.ts/ }]
        }
    ]
})

ruleTester.run('require-cache-integration-test', requireCacheIntegrationTest, {
    valid: [
        {
            code: 'export class FooCache {}',
            filename: path.join(fixtureBase, 'secondary', 'cache', 'has-test', 'foo.cache.ts')
        },
        // outside /src/components/ the rule does not apply
        {
            code: 'export class FooCache {}',
            filename: '/virtual/lib/foo.cache.ts'
        }
    ],
    invalid: [
        {
            code: 'export class FooCache {}',
            filename: path.join(fixtureBase, 'secondary', 'cache', 'missing-test', 'foo.cache.ts'),
            errors: [{ message: /Cache must have integration test\. Missing: .*foo\.cache\.integration\.test\.ts/ }]
        }
    ]
})
