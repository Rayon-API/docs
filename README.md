# RayonAPI documentation

Public Markdown documentation, OpenAPI schema and illustrative examples for Shape generation.

Canonical site: [docs.rayonapi.com](https://docs.rayonapi.com/). This repository's VitePress build checks guides, links, examples and public API assets; CI does not publish it. The styled live site is maintained separately.

```sh
npm ci
npm test
npm run dev
```

Read [quickstart](./guide/quickstart.md), [material collection](./guide/preparation-walkthrough.md), [request fields](./reference/shape.md) and [usage](./reference/usage.md). [Security reports](SECURITY.md). All target examples use reserved domains; no proprietary protection source or live target fixtures are included.

## Keeping published guidance aligned

The Markdown repository and styled site are separate publishing surfaces. For API or SDK behavior changes, update the corresponding guides in both this repository and the private dashboard repository's `public-site/src/docs.tsx`. Keep the downloadable OpenAPI file identical to `api/schema/shape-v1.openapi.json` and the styled site's `public-site/public/schema/shape-v1.openapi.json`.

Publish the styled site through its existing canonical-source and owner-mirror workflow; a passing build in this repository does not publish `docs.rayonapi.com`. Verify the production alias, affected live pages and downloaded schema before reporting that documentation is synced. Historical benchmarks remain dated observations, not current capacity guarantees.


Preparation-first documentation is a coordinated backend release preview. The
30-day migration has no fixed cutoff until the backend rollout is announced.
The canonical OpenAPI must match the backend schema exactly before publication.
Run `npm test` to check preparation flow, public assets, embedded examples, links,
code syntax, and the VitePress build. Keep `generate` signatures and result frames
unchanged, and do not advertise partial material/output as ready.
