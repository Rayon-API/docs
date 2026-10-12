# JavaScript SDK

The [`rayon-sdk-js` repository](https://github.com/Rayon-API/rayon-sdk-js) provides a Node.js SDK using `undici` for API transport. Use Node 20.18.1 or later; Node 22 is suitable. Run it on the server so your API key stays private.

## Install

Version `0.1.0` is available on [npm](https://www.npmjs.com/package/rayon-sdk-js):

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
  // Keep result.headers and result.cookies within their target scope.
} catch (error) {
  if (error instanceof RayonError) {
    if (error.kind === 'capture') {
      throw new Error('Capture failed or was rejected')
    }
    throw new Error('API request failed; inspect the error safely')
  }
  throw error
}
```

`solve(url, key, { profile?, baseUrl?, timeoutMs? })` returns a promise of an accepted `SolveResult`. For an HTTP `200` response with `failed` or `rejected` capture status, it throws `RayonError` with `kind: 'capture'`. The package exports the `SolveResult` TypeScript type and `RayonError` class. Response fields retain their snake_case names, including `target_url`, `duration_ms`, and `profile_used`.

`profile` is an optional JSON-compatible object. Omit it for the default. If it contains a `profile` key, that nested value must be a JSON object. `timeoutMs` controls the client timeout in milliseconds; `duration_ms` measures server solve execution, not total client elapsed time.

The SDK's `undici` transport to RayonAPI does not provide browser-grade TLS for downstream target requests. Use a suitable target transport and apply the [core requirements](./requirements.md).
