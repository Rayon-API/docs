# JavaScript SDK

The [`rayon-sdk-js` repository](https://github.com/Rayon-API/rayon-sdk-js) provides a Node.js SDK using `undici` for API transport. Use Node 20.18.1 or later; Node 22 is suitable. Run it on the server so your API key stays private.

## Install

Registry releases are pending. Build and package the source, then install its tarball in your application:

```sh
git clone https://github.com/Rayon-API/rayon-sdk-js.git
cd rayon-sdk-js
npm ci
npm run build
npm pack
```

Then, from your application directory, replace the path below with your checkout path:

```sh
npm install /path/to/rayon-sdk-js/rayon-sdk-js-0.1.0.tgz
```

After version `0.1.0` is published to npm:

```sh
npm install rayon-sdk-js@0.1.0
```

## Solve

```js
import { solve, RayonError } from 'rayon-sdk-js'

const key = process.env.RAYON_API_KEY
if (!key) throw new Error('Set RAYON_API_KEY')

try {
  const result = await solve('https://example.com/start', key, {
    baseUrl: 'https://api.rayonapi.com',
    timeoutMs: 150_000,
  })
  if (result.status !== 'accepted') {
    throw new Error(`Capture status: ${result.status}`)
  }
  // Keep result.headers and result.cookies within their target scope.
} catch (error) {
  if (error instanceof RayonError) {
    throw new Error('API request failed; inspect the error safely')
  }
  throw error
}
```

`solve(url, key, { profile?, baseUrl?, timeoutMs? })` returns a promise of `SolveResult`. The package exports the `SolveResult` TypeScript type and `RayonError` class. Response fields retain their snake_case names, including `target_url`, `duration_ms`, and `profile_used`.

`profile` is an optional JSON-compatible object. Omit it for the default. `timeoutMs` controls the client timeout in milliseconds; `duration_ms` measures server solve execution, not total client elapsed time.

The SDK's `undici` transport to RayonAPI does not provide browser-grade TLS for downstream target requests. Use a suitable target transport and apply the [core requirements](./requirements.md).
