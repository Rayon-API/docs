# JavaScript / TypeScript SDK

Use the SDK server-side; API keys must not be shipped to browsers.

```sh
npm install rayon-sdk-js@^1
```

```javascript
import { readFile } from 'node:fs/promises'
import { RayonClient } from 'rayon-sdk-js'

const shape = JSON.parse(await readFile('shape-request.json', 'utf8'))
const client = new RayonClient(process.env.RAYON_API_KEY, { timeoutMs: 45000 })
try {
  const result = await client.generate(shape)
  const usage = await client.usage()
  // Apply result.headers using your separate target session.
} finally {
  await client.close()
}
```

Pass an `AbortSignal` to cancel a request:

```javascript
const controller = new AbortController()
const result = await client.generate(shape, { signal: controller.signal })
```

The typed contract matches the [REST reference](../reference/shape.md). The client reuses API connections and provides structured errors; it does not download protection scripts or retry generation automatically.

Cancellation or a transport timeout does not prove the server never admitted the job. Check your usage before deciding whether to make another generation attempt.
