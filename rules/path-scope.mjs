import path from 'node:path'

/**
 * `pathIncludes` fragments are matched against the file's path relative to the
 * project root, not against its absolute path.
 *
 * Matching the absolute path lets a directory ABOVE the repository supply a
 * fragment, so the same file lints differently depending on where it was
 * cloned: a checkout at `~/src/components/my-service` satisfies
 * `/src/components/` for every file in it, switching on rules meant for a
 * `src/components/` tree that the repo does not have. CI and a laptop can
 * disagree for no reason visible in the code.
 *
 * Files that do not sit under the project root — synthetic paths in tests, or a
 * file linted by absolute path from elsewhere — fall back to the full path,
 * which is the only thing available.
 */
export function scopePath(filename, cwd) {
    if (!cwd) {
        return filename
    }

    const relative = path.relative(cwd, filename)

    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
        return filename
    }

    return `/${relative.split(path.sep).join('/')}`
}

export function matchesPathIncludes(scopedPath, pathIncludes) {
    return pathIncludes.every((fragment) => scopedPath.includes(fragment))
}

export function contextCwd(context) {
    return context.cwd ?? context.getCwd?.()
}
