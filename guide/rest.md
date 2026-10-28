# Direct REST (advanced)

The [SDK quickstart](./quickstart.md) includes validation and typed errors.
Use REST when you need to handle these yourself.

## 1. Save the request

Save this as `shape.json`, replacing the reserved URLs with your approved flow.
Keep both material fields omitted for automatic public header selection.

```json
{
  "source_url": "https://shop.example.com/account",
  "profile": {},
  "request": {
    "url": "https://shop.example.com/api/check",
    "method": "POST",
    "content_type": "application/json",
    "body": "{}"
  }
}
```

## 2. Generate

```sh
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/shape \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @shape.json
```

Forward every returned header unchanged using your target client. A non-null
`fallback_reason` means a fallback was used; contact support with `request_id`.
Do not retry uncertain billing outcomes without checking request history.

The examples below use one generation POST, reject redirects and bound responses.
They illustrate transport; use an SDK for complete response validation.

### Python

```python
"""Managed generation example; use the SDK for complete contract validation."""
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

class APIHTTPError(RuntimeError):
    def __init__(self, status):
        super().__init__(f"Rayon API HTTP {status}")
        self.status = status

api_opener = build_opener(NoRedirect)
api_key = os.environ["RAYON_API_KEY"]

def api_call(method, path, payload=None, *, idempotency_key=None, timeout=45):
    headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}
    if idempotency_key is not None:
        headers["Idempotency-Key"] = idempotency_key
    request = Request("https://api.rayonapi.com" + path,
        data=None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers, method=method)
    try:
        with api_opener.open(request, timeout=timeout) as response:
            status = response.status
            if status != 200 and not (path == "/v1/materials/prepare" and status == 202):
                raise APIHTTPError(status)
            raw = response.read(256 * 1024 + 1)
            if len(raw) > 256 * 1024:
                raise RuntimeError("Invalid API response size")
    except HTTPError as error:
        raise APIHTTPError(error.code) from None
    except (URLError, TimeoutError):
        raise RuntimeError("Rayon API transport failed") from None
    def pairs(items):
        result = {}
        for name, value in items:
            if name in result:
                raise ValueError()
            result[name] = value
        return result
    def constant(_):
        raise ValueError()
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=constant)
    except (ValueError, UnicodeError):
        raise RuntimeError("Invalid API JSON response") from None

from pathlib import Path
shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
result = api_call("POST", "/v1/shape", shape)
if result.get("fallback_reason"):
    print("A fallback was used. Contact support with request ID:", result["request_id"])
print("Generated request:", result["request_id"])
# Apply result["headers"] using your existing target session and exact request.
```

### JavaScript

```javascript
// Managed generation example; use an SDK for complete contract validation.
import { readFile } from 'node:fs/promises'
const apiKey = process.env.RAYON_API_KEY
if (!apiKey) throw new Error('Set RAYON_API_KEY')
const shape = JSON.parse(await readFile('shape.json', 'utf8'))
async function api(method, path, payload, timeoutMs = 45000, idempotencyKey) {
  const response = await fetch('https://api.rayonapi.com' + path, {
    method,
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}) },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    redirect: 'error', signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs)))
  })
  if (response.status !== 200 && !(path === '/v1/materials/prepare' && response.status === 202))
    throw Object.assign(new Error(`Rayon API HTTP ${response.status}`), { status: response.status })
  const reader = response.body.getReader(), chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.length
      if (size > 256 * 1024) throw new Error('Invalid API response size')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
}
const result = await api('POST', '/v1/shape', shape)
if (result.fallback_reason) console.warn('A fallback was used. Contact support with request ID:', result.request_id)
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
```

### Go

```go
// Managed generation example; use an SDK for complete contract validation.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

func main() {
	raw, err := os.ReadFile("shape.json")
	if err != nil {
		panic("Read shape.json before calling the API")
	}
	var shape map[string]any
	if json.Unmarshal(raw, &shape) != nil {
		panic("Invalid shape.json")
	}
	apiKey := os.Getenv("RAYON_API_KEY")
	if apiKey == "" {
		panic("Set RAYON_API_KEY")
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	client := &http.Client{Timeout: 45 * time.Second, Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	defer client.CloseIdleConnections()
	api := func(ctx context.Context, method, path string, body map[string]any, key string) (map[string]any, int) {
		var rd io.Reader
		if body != nil {
			b, e := json.Marshal(body)
			if e != nil {
				panic("Invalid API input")
			}
			rd = bytes.NewReader(b)
		}
		req, e := http.NewRequestWithContext(ctx, method, "https://api.rayonapi.com"+path, rd)
		if e != nil {
			panic("Unable to build API request")
		}
		req.Header.Set("Authorization", "Bearer "+apiKey)
		req.Header.Set("Content-Type", "application/json")
		if key != "" {
			req.Header.Set("Idempotency-Key", key)
		}
		resp, e := client.Do(req)
		if e != nil {
			panic("API transport failed")
		}
		defer resp.Body.Close()
		if resp.StatusCode != 200 && !(path == "/v1/materials/prepare" && resp.StatusCode == 202) {
			return nil, resp.StatusCode
		}
		b, e := io.ReadAll(io.LimitReader(resp.Body, 256*1024+1))
		if e != nil || len(b) > 256*1024 {
			panic("Invalid API response size")
		}
		var value map[string]any
		if json.Unmarshal(b, &value) != nil {
			panic("Invalid API response")
		}
		return value, resp.StatusCode
	}
	result, status := api(context.Background(), "POST", "/v1/shape", shape, "")
	if status != 200 {
		panic(fmt.Sprintf("Generation HTTP %d", status))
	}
	if result["fallback_reason"] != nil {
		fmt.Println("A fallback was used. Contact support with request ID:", result["request_id"])
	}
	fmt.Println("Generated request:", result["request_id"])
	// Apply result["headers"] using your existing target session and exact request.
}
```

## Optional explicit material

Supply `scripts` or a private `material_ref` to override automatic selection.
[Preparation](../reference/preparation.md) is optional for these inputs and still
requires material. [Form mode](../form-payload-integration.md) also requires
explicit material. See [limits and fields](../reference/shape.md).
