# JavaScript / TypeScript SDK

Requires Node.js 20.18.1+. ESM, CommonJS and TypeScript declarations are included. Keep the SDK and API key server-side.

## 1. Install

```sh
npm install rayon-sdk-js@^1
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

[Apply `result.headers`](./applying-headers.md) unchanged. Structured errors expose sanitized codes and request IDs. The client reuses API connections, validates results and never downloads target material or retries generation automatically.

Persistent clients remember unexpired references for identical ordered material. After `material_expired`, use a fresh client with retained scripts and current context so a cached reference is not selected again. The one-shot `generate(shape, apiKey)` helper closes after one call.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-js) for types and options.

`generation_ms` measures server generation. Time the complete API call for upload/network latency. Cancellation or timeout can occur after billing settlement; check usage/history before retrying.
