#!/usr/bin/env node
// CASCADE_TODO: enforce frontmatter across md files
// CASCADE_HINT: Keep simple; scan src/content and report missing fields
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = process.cwd()
const CONTENT = join(ROOT, 'src', 'content')

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(p)
    else if (entry.isFile() && entry.name.endsWith('.md')) yield p
  }
}

;(async () => {
  let failures = 0
  for await (const file of walk(CONTENT)) {
    const src = await readFile(file, 'utf8')
    const fm = src.match(/^---[\s\S]*?---/)
    if (!fm) { console.log('CASCADE: missing frontmatter', file); failures++; continue }
    const req = ['title', 'date']
    for (const key of req) {
      if (!new RegExp(`\n${key}:`).test(fm[0])) { console.log('CASCADE: missing key', key, 'in', file); failures++ }
    }
  }
  if (failures) {
    console.error('CASCADE: frontmatter check failed:', failures)
    process.exitCode = 1
  } else {
    console.log('CASCADE: frontmatter OK')
  }
})().catch((e) => { console.error(e); process.exit(1) })
