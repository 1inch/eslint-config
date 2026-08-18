import { it, describe } from 'vitest'
import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { noInternalOverridesInIntegrationTests } from './no-internal-overrides-in-integration-tests.mjs'

RuleTester.it = it
RuleTester.describe = describe
RuleTester.itOnly = it.only

const ruleTester = new RuleTester({
    languageOptions: { parser: tseslint.parser }
})

ruleTester.run('no-internal-overrides-in-integration-tests', noInternalOverridesInIntegrationTests, {
    valid: [
        // unit tests may mock freely
        {
            code: 'builder.overrideProvider(Foo).useValue(fake)',
            filename: '/virtual/src/a.test.ts'
        },
        // provider-definition object properties are allowed in integration tests
        {
            code: 'const providers = [{ provide: Foo, useValue: fake }]',
            filename: '/virtual/src/a.integration.test.ts'
        },
        // unrelated method calls are allowed in integration tests
        {
            code: 'await app.init(); moduleRef.get(Foo)',
            filename: '/virtual/src/a.integration.test.ts'
        },
        // non-test source files are not governed
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.ts'
        },
        // custom suffixes replace the defaults entirely
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.integration.test.ts',
            options: [{ integrationTestSuffixes: ['.itest.ts'] }]
        }
    ],
    invalid: [
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.overrideProvider\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        // the rationale is part of every error message
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /If you need to mock internals, write a unit test \(\*\.test\.ts\) instead/ }]
        },
        // chained override + useValue reports both calls
        {
            code: 'builder.overrideProvider(Foo).useValue(fake)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: 2
        },
        {
            code: 'builder.overrideGuard(AuthGuard)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.overrideGuard\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.overrideInterceptor(LoggingInterceptor)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.overrideInterceptor\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.overridePipe(ValidationPipe)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.overridePipe\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.overrideFilter(ExceptionFilter)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.overrideFilter\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.useClass(FakeService)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.useClass\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.useFactory(() => fake)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.useFactory\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        {
            code: 'builder.useExisting(OtherService)',
            filename: '/virtual/src/a.integration.test.ts',
            errors: [{ message: /'\.useExisting\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        // .integration.spec.ts is covered by the defaults
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.integration.spec.ts',
            errors: [{ message: /'\.overrideProvider\(\.\.\.\)' is forbidden in integration tests/ }]
        },
        // custom suffixes govern custom file naming
        {
            code: 'builder.overrideProvider(Foo)',
            filename: '/virtual/src/a.itest.ts',
            options: [{ integrationTestSuffixes: ['.itest.ts'] }],
            errors: [{ message: /'\.overrideProvider\(\.\.\.\)' is forbidden in integration tests/ }]
        }
    ]
})
