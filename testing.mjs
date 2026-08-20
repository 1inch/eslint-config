import { requireTestForClassOrFunction } from './rules/require-test-for-class-or-function.mjs'
import {
    requireControllerIntegrationTest,
    requireSecondaryAdapterIntegrationTest,
    requireUseCaseUnitTest,
    requireCacheIntegrationTest
} from './rules/require-integration-test.mjs'
import { noInternalOverridesInIntegrationTests } from './rules/no-internal-overrides-in-integration-tests.mjs'

/**
 * Opt-in testing preset (`@1inch/eslint-config/testing`).
 *
 * Enforces test-coverage conventions for hexagonal NestJS services.
 * NOT part of the default export — consumers enable it explicitly:
 *
 *     import oneInchEslintConfig from '@1inch/eslint-config'
 *     import oneInchTestingConfig from '@1inch/eslint-config/testing'
 *
 *     export default [...oneInchEslintConfig, ...oneInchTestingConfig]
 *
 * The preset is dependency-free (plain rule objects) and works with ESLint 9 and 10.
 * All rules accept options for test-file suffixes and path scoping — see README.
 */

export const testingPlugin = {
    meta: {
        name: '1inch-testing'
    },
    rules: {
        'require-test-for-class-or-function': requireTestForClassOrFunction,
        'require-controller-integration-test': requireControllerIntegrationTest,
        'require-secondary-adapter-integration-test': requireSecondaryAdapterIntegrationTest,
        'require-use-case-unit-test': requireUseCaseUnitTest,
        'require-cache-integration-test': requireCacheIntegrationTest,
        'no-internal-overrides-in-integration-tests': noInternalOverridesInIntegrationTests
    }
}

export default [
    {
        name: '@1inch/eslint-config/testing',
        plugins: {
            '1inch-testing': testingPlugin
        },
        rules: {
            '1inch-testing/require-test-for-class-or-function': 'error',
            '1inch-testing/require-controller-integration-test': 'error',
            '1inch-testing/require-secondary-adapter-integration-test': 'error',
            '1inch-testing/require-use-case-unit-test': 'error',
            '1inch-testing/require-cache-integration-test': 'error',
            '1inch-testing/no-internal-overrides-in-integration-tests': 'error'
        }
    }
]
