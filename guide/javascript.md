# JavaScript / TypeScript SDK

Requires Node.js 20.18.1+. ESM, CommonJS and TypeScript declarations are included. Keep the SDK and API key server-side.

## 1. Install

```sh
npm install rayon-sdk-js@^1.1.4
```

## 2. Generate with a persistent client

Prepare `shape.json` using the [collection guide](./preparation-walkthrough.md) and [request contract](../reference/shape.md).

```javascript
import { readFile } from 'node:fs/promises'
import { RayonClient } from 'rayon-sdk-js'

const shape = JSON.parse(await readFile('shape.json', 'utf8'))
const client = new RayonClient(process.env.RAYON_API_KEY, { timeoutMs: 45000 })
try {
  const result = await client.generate(shape)
  const usage = await client.usage()
  // Apply result.headers in your existing target session.
} finally {
  await client.close()
}
```

To cancel, pass an `AbortSignal`:

```javascript
const controller = new AbortController()
const result = await client.generate(shape, { signal: controller.signal })
```

## 3. Handle results and errors

[Apply `result.headers`](./applying-headers.md) unchanged. Structured errors expose safe messages, codes and request IDs. SDK 1.1.3+ adds readable guidance from a trusted error catalog. Optional `reason`, `action`, `domain`, `field` and `billingStatus` explain the next step. The client reuses API connections, validates results and never downloads target material. The material recovery behavior below is the only automatic retry.

```javascript
import { RayonError } from 'rayon-sdk-js'

try {
  await client.generate(shape)
} catch (error) {
  if (!(error instanceof RayonError)) throw error
  console.error(error.message, error.action, error.requestId)
  // Check history before retrying if billingStatus is pending or unknown.
}
```

`billingStatus: 'not_charged'` confirms no charge. An absent billing status is unknown. See [error and retry guidance](../reference/errors.md).

SDK 1.1.4+ persistent clients retain original source in memory (at most 128 bundles and 16 MiB per client), reuse references for identical ordered material, and refresh on the next generation within five seconds of expiry. Concurrent callers share the material upload; every caller still generates its own result with current inputs. There is no background generation. After a definite HTTP 422 `material_expired` response with `billing_status: "not_charged"`, the client retries once with retained source. Other errors and ambiguous billing outcomes are never retried automatically. Reference-only recovery requires source still retained in the same client; keep your own source copy. Closing the client clears retained source. The one-shot `generate(shape, apiKey)` helper closes after one call.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-js) for types and options.

`generation_ms` measures server generation. Time the complete API call for upload/network latency. Cancellation or timeout can occur after billing settlement; check usage/history before retrying.

SDK 1.1.0+ supports six required headers with optional same-family `a0`. Upgrade older SDKs, which require exactly six headers. Forward the complete returned map unchanged, without appending captured `a0` or splitting `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode is supported by SDK 1.1.0+ and direct REST.
