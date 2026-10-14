import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const routes = {
  'reference/solve': 'migration',
  'reference/auth': 'quickstart',
}

for (const [path, slug] of Object.entries(routes)) {
  const canonical = `https://docs.rayonapi.com/${slug}`
  test(`${path} moves to its canonical guide with a no-JavaScript link`, async () => {
    const page = await readFile(resolve(root, `${path}.md`), 'utf8').catch(error => {
      if (error.code === 'ENOENT') return ''
      throw error
    })
    assert.match(page, /Documentation moved/)
    assert.ok(page.includes(`href: ${canonical}`), 'HTTPS canonical link')
    assert.ok(page.includes(`content: '0; url=${canonical}'`), 'HTML refresh redirect')
    assert.ok(page.includes(`](${canonical})`), 'usable link without JavaScript')
    assert.ok(!page.includes('```'), 'no duplicate examples')
  })
}

test('public profile collector and schema remain available', async () => {
  await access(resolve(root, 'public/examples/capture-profile.js'))
  const schema = JSON.parse(await readFile(resolve(root, 'public/schema/shape-v1.openapi.json'), 'utf8'))
  assert.ok(schema.paths['/v1/shape'])
})

if (process.env.CHECK_BUILD) {
  test('built public assets preserve their URLs and content', async () => {
    for (const asset of ['schema/shape-v1.openapi.json', 'examples/capture-profile.js']) {
      assert.equal(
        await readFile(resolve(root, `.vitepress/dist/${asset}`), 'utf8'),
        await readFile(resolve(root, `public/${asset}`), 'utf8'),
      )
    }
  })
  for (const [path, slug] of Object.entries(routes)) {
    const canonical = `https://docs.rayonapi.com/${slug}`
    test(`built aliases and head tags for ${path}`, async () => {
      const html = await readFile(resolve(root, `.vitepress/dist/${path}.html`), 'utf8')
      assert.ok(html.includes(`rel="canonical" href="${canonical}"`))
      assert.ok(html.includes(`http-equiv="refresh" content="0; url=${canonical}"`))
      assert.ok(html.includes(`href="${canonical}"`))
      if (path !== 'index') {
        const alias = await readFile(resolve(root, `.vitepress/dist/${path}/index.html`), 'utf8')
        assert.equal(alias, html)
      }
    })
  }
}
