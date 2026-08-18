import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

/**
 * Fixture trees for the filesystem-dependent testing rules (they look for
 * sibling test files with `existsSync`) are generated at runtime in a temp
 * directory instead of being committed as one-line stub files.
 *
 * `createFixtureRoot` runs at module load because `RuleTester.run(...)` needs
 * the absolute fixture filenames when the test objects are built; the files
 * themselves are written in `beforeAll` and removed in `afterAll`.
 */

export function createFixtureRoot(prefix) {
    return mkdtempSync(path.join(tmpdir(), `1inch-eslint-config-${prefix}`))
}

export function writeFixtureFiles(root, relativePaths) {
    for (const relativePath of relativePaths) {
        const absolutePath = path.join(root, relativePath)

        mkdirSync(path.dirname(absolutePath), { recursive: true })
        writeFileSync(absolutePath, 'export {}\n')
    }
}

export function removeFixtureRoot(root) {
    rmSync(root, { recursive: true, force: true })
}
