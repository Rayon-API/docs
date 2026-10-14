import { defineConfig } from 'vitepress'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export default defineConfig({
  title: 'RayonAPI',
  description: 'Material-only Shape header and form telemetry API and SDK documentation.',
  base: process.env.DOCS_BASE_PATH || '/',
  srcExclude: ['README.md', 'PRODUCT.md', 'DESIGN.md', 'SECURITY.md', 'CHANGELOG.md'],
  cleanUrls: true,
  appearance: 'dark',
  head: [['link', { rel: 'icon', href: `${process.env.DOCS_BASE_PATH || '/'}favicon.svg`, type: 'image/svg+xml' }]],
  async buildEnd(siteConfig) {
    // Keep intentional legacy redirects usable on static hosts with trailing slashes.
    for (const path of ['reference/auth', 'reference/solve', 'guide/migration']) {
      const alias = join(siteConfig.outDir, path, 'index.html')
      await mkdir(dirname(alias), { recursive: true })
      await copyFile(join(siteConfig.outDir, `${path}.html`), alias)
    }
  },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'API reference', link: '/reference/shape' },
      { text: 'Dashboard', link: 'https://dashboard.rayonapi.com' }
    ],
    sidebar: [
      { text: 'Start here', items: [
        { text: 'Overview', link: '/' },
        { text: 'Quickstart', link: '/guide/quickstart' },
        { text: 'Core requirements', link: '/guide/requirements' }
      ] },
      { text: 'Integrate', items: [
        { text: 'Collect inputs', link: '/guide/preparation-walkthrough' },
        { text: 'Download scripts', link: '/guide/material' },
        { text: 'Browser profiles', link: '/guide/profiles' },
        { text: 'Apply headers', link: '/guide/applying-headers' },
        { text: 'Form payload integration', link: '/form-payload-integration' },
        { text: 'Python SDK', link: '/guide/python' },
        { text: 'JavaScript SDK', link: '/guide/javascript' },
        { text: 'Direct REST examples', link: '/guide/rest' },
        { text: 'Shape / F5', link: '/guide/shape-f5' },
        { text: 'Troubleshooting', link: '/guide/troubleshooting' }
      ] },
      { text: 'Reference', items: [
        { text: 'POST /v1/shape', link: '/reference/shape' },
        { text: 'Errors and limits', link: '/reference/errors' },
        { text: 'GET /v1/usage', link: '/reference/usage' }
      ] }
    ],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Rayon-API' }],
    footer: { message: 'RayonAPI documentation · MIT license', copyright: 'Rayon-API' }
  }
})
