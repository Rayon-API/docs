# RayonAPI legacy documentation links

The current guides and API reference live at [docs.rayonapi.com](https://docs.rayonapi.com/).
This repository preserves old guide/reference URLs as redirects, with direct links for readers without JavaScript.
Edit the canonical documentation in the private frontend project; do not author another copy here.

Public assets remain available at `/schema/shape-v1.openapi.json` and `/examples/capture-profile.js`.
The schema is the public API contract; the collector reads a client-owned browser profile.

```sh
npm ci
npm test
npm run dev
```

Builds require Node.js 22. `DOCS_BASE_PATH=/docs/ npm test` checks the GitHub Pages distribution.
The build preserves `.html`, extensionless and trailing-slash legacy page aliases.

[Support](mailto:support@rayonapi.com) · [Discord](https://discord.gg/TwhkJNyHWs) · [Security reports](SECURITY.md) · [MIT license](LICENSE)
