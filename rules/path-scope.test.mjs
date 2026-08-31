import { describe, it, expect } from 'vitest'
import { scopePath, matchesPathIncludes } from './path-scope.mjs'

describe('scopePath', () => {
    it('makes the path relative to the project root, with a leading slash', () => {
        expect(scopePath('/home/dev/my-service/src/app/foo.controller.ts', '/home/dev/my-service')).toBe(
            '/src/app/foo.controller.ts'
        )
    })

    it('does not let a directory above the project supply a fragment', () => {
        // The bug this exists for: matching the absolute path means a checkout
        // location can switch rules on. Both clones below hold the same repo,
        // which has no components tree of its own.
        const plain = scopePath(
            '/home/dev/work/my-service/src/modules/cache/base.cache.ts',
            '/home/dev/work/my-service'
        )
        const collides = scopePath(
            '/home/dev/src/components/my-service/src/modules/cache/base.cache.ts',
            '/home/dev/src/components/my-service'
        )

        expect(plain).toBe('/src/modules/cache/base.cache.ts')
        expect(collides).toBe('/src/modules/cache/base.cache.ts')
        expect(matchesPathIncludes(collides, ['/src/components/'])).toBe(false)
    })

    it('still matches a fragment the repository really has', () => {
        const scoped = scopePath(
            '/home/dev/aqua-api/src/components/api/secondary/foo.repository.ts',
            '/home/dev/aqua-api'
        )

        expect(matchesPathIncludes(scoped, ['/src/components/'])).toBe(true)
        expect(matchesPathIncludes(scoped, ['/secondary/'])).toBe(true)
    })

    it('falls back to the full path for files outside the project root', () => {
        expect(scopePath('/virtual/app/foo.controller.ts', '/home/dev/my-service')).toBe(
            '/virtual/app/foo.controller.ts'
        )
    })

    it('falls back to the full path when there is no cwd', () => {
        expect(scopePath('/virtual/app/foo.controller.ts', undefined)).toBe(
            '/virtual/app/foo.controller.ts'
        )
    })
})

describe('matchesPathIncludes', () => {
    it('requires every fragment (AND)', () => {
        expect(matchesPathIncludes('/src/components/a/core/x.ts', ['/src/components/', '/core/'])).toBe(
            true
        )
        expect(matchesPathIncludes('/src/modules/core/x.ts', ['/src/components/', '/core/'])).toBe(false)
    })

    it('is satisfied by an empty fragment list', () => {
        expect(matchesPathIncludes('/anywhere/x.ts', [])).toBe(true)
    })
})
