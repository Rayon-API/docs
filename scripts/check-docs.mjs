import { readFile, readdir, access } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const pages = ['index.md', 'README.md', 'SECURITY.md', 'CHANGELOG.md']
for (const folder of ['guide', 'reference']) {
  pages.push(...(await readdir(join(root, folder))).filter(name => name.endsWith('.md')).map(name => `${folder}/${name}`))
}

function checkSyntax(command, args, source, label) {
  const result = spawnSync(command, args, { input: source, encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(`${label}: ${result.error?.message ?? result.stderr}`)
  }
}

function slug(heading) {
  return heading.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

let blocks = 0
let links = 0
for (const page of pages) {
  const path = join(root, page)
  const text = await readFile(path, 'utf8')
  let fence = null
  let language = ''
  let source = []
  const prose = []
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/)
    if (marker) {
      if (fence === null) {
        fence = marker[1]
        language = marker[2].trim().split(/[\s\[]/)[0]
        source = []
      } else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        const code = source.join('\n')
        if (language === 'json') JSON.parse(code)
        if (language === 'python') checkSyntax('python3', ['-c', 'import ast,sys; ast.parse(sys.stdin.read())'], code, page)
        if (['js', 'javascript'].includes(language)) checkSyntax(process.execPath, ['--input-type=module', '--check'], code, page)
        if (['sh', 'bash'].includes(language)) checkSyntax('bash', ['-n'], code, page)
        blocks++
        fence = null
      } else {
        source.push(line)
      }
    } else if (fence !== null) {
      source.push(line)
    } else {
      prose.push(line)
    }
  }
  if (fence !== null) throw new Error(`${page}: unclosed code fence`)

  const content = prose.join('\n')
  for (const match of content.matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1]
    if (/^(https?:|mailto:)/.test(href)) {
      const url = new URL(href)
      if (!['https:', 'mailto:'].includes(url.protocol)) throw new Error(`${page}: insecure link ${href}`)
      links++
      continue
    }
    const [file, fragment] = href.split('#')
    const target = file ? resolve(dirname(path), decodeURIComponent(file)) : path
    await access(target).catch(() => { throw new Error(`${page}: missing link ${href}`) })
    if (fragment && extname(target) === '.md') {
      const targetText = await readFile(target, 'utf8')
      const headings = [...targetText.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => slug(match[1]))
      if (!headings.includes(fragment)) throw new Error(`${page}: missing anchor ${href}`)
    }
    links++
  }
  for (const match of content.matchAll(/^<<<\s+(.+)$/gm)) {
    await access(resolve(dirname(path), match[1].trim().replace(/\{[^}]*\}$/, '')))
  }
}

console.log(`Checked ${pages.length} pages, ${links} links and ${blocks} code blocks.`)
