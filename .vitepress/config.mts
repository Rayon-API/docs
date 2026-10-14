import { defineConfig } from 'vitepress'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export default defineConfig({
  title: 'RayonAPI documentation moved',
  description: 'Legacy links to the canonical documentation at docs.rayonapi.com.',
  base: process.env.DOCS_BASE_PATH || '/',
  srcExclude: ['README.md', 'SECURITY.md', 'CHANGELOG.md'],
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: `${process.env.DOCS_BASE_PATH || '/'}favicon.svg`, type: 'image/svg+xml' }]],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Current documentation', link: 'https://docs.rayonapi.com/' },
      { text: 'Support', link: 'mailto:support@rayonapi.com' },
      { text: 'Discord', link: 'https://discord.gg/TwhkJNyHWs' },
    ],
    sidebar: false,
    footer: { message: 'Legacy documentation links · MIT license', copyright: 'Rayon-API' },
  },
  async buildEnd(siteConfig) {
    // Static hosts may resolve /guide/name/ only through an index.html file.
    for (const page of siteConfig.pages) {
      if (page === 'index.md') continue
      const path = page.replace(/\.md$/, '')
      const alias = join(siteConfig.outDir, path, 'index.html')
      await mkdir(dirname(alias), { recursive: true })
      await copyFile(join(siteConfig.outDir, `${path}.html`), alias)
    }
  },
})
