import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Only .mjs test files are vitest suites; *.test.ts files under
        // rules/__fixtures__/ are ESLint rule fixtures, not tests.
        include: ['**/*.test.mjs']
    }
})
