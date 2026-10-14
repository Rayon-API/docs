# Direct REST

## 1. Prepare the request file

Collect material using the [walkthrough](./preparation-walkthrough.md). Save the [complete request](../reference/shape.md) as UTF-8 JSON in `shape.json`.

## 2. Call RayonAPI

```sh
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/shape \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @shape.json
```

Use uncompressed JSON first. Gzip requests must meet both compressed and decoded limits. Keep keys out of URLs and logs.

### Python

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.py).

```python
import json
import os
from pathlib import Path
import httpx

shape = json.loads(Path("shape.json").read_text())
with httpx.Client(timeout=45, trust_env=False, follow_redirects=False) as client:
    response = client.post(
        "https://api.rayonapi.com/v1/shape",
        headers={"Authorization": f"Bearer {os.environ['RAYON_API_KEY']}"},
        json=shape,
    )
    response.raise_for_status()
    result = response.json()
print("Generated request:", result["request_id"])
# Apply result["headers"] using your existing target session and exact request.
```

### JavaScript

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.mjs).

```javascript
import { readFile } from 'node:fs/promises'
const body = await readFile('shape.json', 'utf8')
const response = await fetch('https://api.rayonapi.com/v1/shape', {
  method: 'POST',
  headers: { authorization: `Bearer ${process.env.RAYON_API_KEY}`, 'content-type': 'application/json' },
  body,
  redirect: 'error',
  signal: AbortSignal.timeout(45000)
})
if (!response.ok) throw new Error(`Generation failed: HTTP ${response.status}`)
const result = await response.json()
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
```

### Go

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.go).

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "time"
)

func main() {
    body, err := os.ReadFile("shape.json")
    if err != nil { panic("Read shape.json before calling the API") }
    req, err := http.NewRequest("POST", "https://api.rayonapi.com/v1/shape", bytes.NewReader(body))
    if err != nil { panic("Unable to build API request") }
    req.Header.Set("Authorization", "Bearer " + os.Getenv("RAYON_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    transport := http.DefaultTransport.(*http.Transport).Clone()
    transport.Proxy = nil
    client := &http.Client{Timeout: 45 * time.Second, Transport: transport,
        CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
    defer client.CloseIdleConnections()
    response, err := client.Do(req)
    if err != nil { panic("API transport failed") }
    defer response.Body.Close()
    if response.StatusCode != http.StatusOK { panic(fmt.Sprintf("Generation failed: HTTP %d", response.StatusCode)) }
    raw, err := io.ReadAll(io.LimitReader(response.Body, 256 * 1024 + 1))
    if err != nil || len(raw) > 256 * 1024 { panic("Invalid API response size") }
    var result struct { RequestID string `json:"request_id"`; Headers map[string]string `json:"headers"` }
    if json.Unmarshal(raw, &result) != nil { panic("Invalid API response") }
    fmt.Println("Generated request:", result.RequestID)
    // Apply result.Headers using your existing target session and exact request.
}
```

## 3. Send the target request

[Apply the returned headers](./applying-headers.md) in the session that collected material. These examples call only RayonAPI; they do not collect scripts or send target requests.
