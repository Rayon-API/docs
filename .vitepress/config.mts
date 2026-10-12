import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'RayonAPI',
  description: 'Public API documentation for telemetry capture and safe session replay.',
  base: '/docs/',
  srcExclude: ['README.md', 'PRODUCT.md', 'DESIGN.md'],
  cleanUrls: true,
  appearance: 'dark',
  head: [['link', { rel: 'icon', href: '/docs/favicon.svg', type: 'image/svg+xml' }]],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'API reference', link: '/reference/solve' },
      { text: 'Dashboard', link: 'https://dashboard.rayonapi.com' }
    ],
    sidebar: [
      { text: 'Start here', items: [
        { text: 'Overview', link: '/' },
        { text: 'Quickstart', link: '/guide/quickstart' },
        { text: 'Core requirements', link: '/guide/requirements' }
      ] },
      { text: 'Integrate', items: [
        { text: 'Python SDK', link: '/guide/python' },
        { text: 'JavaScript SDK', link: '/guide/javascript' },
        { text: 'Direct REST examples', link: '/guide/rest' },
        { text: 'Shape / F5', link: '/guide/shape-f5' },
        { text: 'Troubleshooting', link: '/guide/troubleshooting' }
      ] },
      { text: 'Reference', items: [
        { text: 'POST /solve', link: '/reference/solve' },
        { text: 'Errors and limits', link: '/reference/errors' }
      ] }
    ],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Rayon-API' }],
    footer: { message: 'RayonAPI documentation · MIT license', copyright: 'Rayon-API' }
  }
})
