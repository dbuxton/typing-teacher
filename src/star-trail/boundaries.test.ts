import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Star Trail is its own app that happens to live in this repo. These checks keep
 * it that way: it may borrow Typing Teacher's four dependency-free leaf files —
 * the key map, the seeded RNG, speech, and the curriculum's key order — and
 * nothing else, and Typing Teacher never reaches back in.
 *
 * The line matters because whatever Star Trail imports ships in its bundle. One
 * stray import of Typing Teacher's store would drag in the whole reward
 * catalogue and a second save format.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(HERE, '..')
const ROOT = resolve(SRC, '..')

const SHARED = ['engine/keymap.ts', 'engine/rng.ts', 'engine/speech.ts', 'data/curriculum.ts'].map((path) =>
  join(SRC, path),
)

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

const IMPORT =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

function importsOf(file: string): string[] {
  return [...readFileSync(file, 'utf8').matchAll(IMPORT)].map((match) => match[1] ?? match[2] ?? match[3])
}

/** The file a relative import points at. Package imports (react, zustand…) give null. */
function resolveImport(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const base = resolve(dirname(from), specifier)
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? base
}

const isStarTrail = (file: string) => file.startsWith(HERE + sep)
const starTrailFiles = sourceFiles(HERE)
const typingTeacherFiles = sourceFiles(SRC).filter((file) => !isStarTrail(file))

describe('Star Trail stays a separate app', () => {
  it('only borrows the four dependency-free files from Typing Teacher', () => {
    for (const file of starTrailFiles) {
      for (const specifier of importsOf(file)) {
        const target = resolveImport(file, specifier)
        if (target === null || isStarTrail(target)) continue
        expect(SHARED, `${relative(ROOT, file)} imports ${specifier}`).toContain(target)
      }
    }
  })

  it('keeps those shared files free of imports, so sharing them drags nothing else in', () => {
    for (const file of SHARED) {
      expect(importsOf(file), relative(ROOT, file)).toEqual([])
    }
  })

  it('is never imported by Typing Teacher', () => {
    for (const file of typingTeacherFiles) {
      for (const specifier of importsOf(file)) {
        const target = resolveImport(file, specifier)
        expect(target !== null && isStarTrail(target), `${relative(ROOT, file)} imports ${specifier}`).toBe(false)
      }
    }
  })

  it('is not linked from anywhere in Typing Teacher', () => {
    // "Its own address only": no button, link or mention on the other app's pages.
    for (const file of [...typingTeacherFiles, join(ROOT, 'index.html')]) {
      expect(readFileSync(file, 'utf8').includes('star-trail'), relative(ROOT, file)).toBe(false)
    }
  })
})
