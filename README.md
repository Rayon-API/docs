# RayonAPI documentation

Public developer docs for RayonAPI, built with VitePress 1.6.4. The site is configured for [https://rayon-api.github.io/docs/](https://rayon-api.github.io/docs/).

## Development

Use Node 22 and npm. Python 3 and Go 1.20+ are required for example syntax checks; checks do not make network requests or require API keys.

```sh
nvm use
npm ci
npm run dev
```

Run the full checks and build:

```sh
npm test
npm run preview
```

`npm run check` validates local links, code-fence balance, JSON blocks, Python/JavaScript syntax, and the Go REST example. `npm run build` builds the site and checks Markdown links. Source examples are included in the rendered docs, so the checked files are the examples readers see.

VitePress remains pinned to 1.6.4. A tested override pins Vite to patched version 6.4.4 until the upstream stable dependency moves; this also updates esbuild. Recheck the build, preview, search, and `npm audit` before changing or removing the override.

## GitHub Pages

The workflow checks and builds pull requests. Pushes to `main` and manual dispatches also deploy after the build passes. Set repository **Settings → Pages → Source** to **GitHub Actions**. The configured base path is `/docs/`, as required for a project site; see the [VitePress deployment guide](https://vuejs.github.io/vitepress/v1/guide/deploy).

Deployment uses the repository's `github-pages` environment. No API credentials are needed for the docs build or deployment.

## Content boundaries

Document only the public API contract and SDKs. Use fictional or redacted values; do not add private service code, internal addresses, telemetry captures, profile dumps, cookies, or API keys. The Python SDK is published on PyPI and the JavaScript SDK on npm.

## License

[MIT](./LICENSE).
