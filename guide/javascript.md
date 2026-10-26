# JavaScript / TypeScript SDK

Requires Node.js 20.18.1+. ESM, CommonJS and TypeScript declarations are included. Keep the SDK and API key server-side. The preparation API is available; use the explicit helpers before workload startup.

## 1. Install

```sh
npm install rayon-sdk-js@^2.0.0
```

## 2. Prepare at startup with a persistent client

Start with the [Quickstart](./quickstart.md). Prepare `shape.json` using the shared [input guide](./preparation-walkthrough.md). Check free account usage before generation, then apply the result through your existing target integration.

```javascript
import { readFile } from 'node:fs/promises'
import { RayonClient } from 'rayon-sdk-js'

const shape = JSON.parse(await readFile('shape.json', 'utf8'))
const apiKey = process.env.RAYON_API_KEY
if (!apiKey) throw new Error('Set RAYON_API_KEY')
const client = new RayonClient(apiKey, { timeoutMs: 45000 })
try {
  const usage = await client.usage() // Free; no generation quota used.
  const ready = await client.prepareAndWait(shape, { waitTimeoutMs: 60000 })
  const { scripts, ...current } = shape
  const result = await client.generate({ ...current, material_ref: ready.material_ref })
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

[Apply `result.headers`](./applying-headers.md) unchanged. Structured errors expose safe messages, codes and request IDs. SDK 1.1.3+ adds readable guidance from a trusted error catalog. Optional `reason`, `action`, `domain`, `field` and `billingStatus` explain the next step. The client reuses API connections, validates results and never downloads target material. The material recovery behavior below is the only automatic generation retry.

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

Keep one client open across requests. Python and JavaScript SDK 2.0.0 reuse material
in both modes and generate fresh telemetry each time. The shared [material policy](./material.md#4-reuse-source-with-a-material-reference)
covers retention, expiry, concurrent calls and the single confirmed uncharged recovery.
Other generation failures are not automatically retried. The one-shot helper closes
after one call, so use a persistent client for an integration.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-js) for types and options.

`generation_ms` measures server generation. Time the complete API call for upload/network latency. Cancellation or timeout can occur after billing settlement; check usage/history before retrying.

Forward the complete returned header map unchanged, including optional same-family `a0`. Never append captured telemetry or split `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; the SDK supports form mode.

[Python](./python.md) · [JavaScript / TypeScript](./javascript.md) · [Go](./go.md) · [Playwright](./playwright.md)

## Explicit preparation and resumable waits

Use `prepare(shape, options)` to start one job, `getPreparation(id, { wait: 0 })`
to inspect it, `waitUntilReady(id, { waitTimeoutMs: 60000, signal })` to wait, or
`prepareAndWait(shape, options)` to combine the explicit steps. `ReadyMaterial`
contains safe metadata only. `RayonError.preparationId` lets you resume a bounded,
interrupted wait. Terminal kinds are `preparation_failed` and
`preparation_expired`; cancellation and timeout do not cancel the server job.

Prepare the exact full context again after readiness expiry or relevant input
changes. The source-only generation cache is separate from readiness, and
`generate` never prepares or waits implicitly. See [preparation states, lifetimes
and planned migration](../reference/preparation.md).
