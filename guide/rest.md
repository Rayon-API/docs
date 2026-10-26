# Direct REST (advanced)

Use the [SDK quickstart](./quickstart.md) for the recommended integration. Use direct REST when you need to own validation, material references, result parsing and retry handling yourself.

## 1. Prepare the request file

Collect material using the [walkthrough](./preparation-walkthrough.md). Save the [complete request](../reference/shape.md) as UTF-8 JSON in `shape.json`.

## 2. Explicitly prepare, wait, then call generation

```sh
PREPARATION_KEY="$(python3 -c 'import uuid; print(uuid.uuid4().hex)')"
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/materials/prepare \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  -H "Idempotency-Key: $PREPARATION_KEY" \
  --data-binary @shape.json
```

The additive preparation API is available. Read the returned state and use
authenticated status reads at
`/v1/materials/preparations/{preparation_id}?wait=10` until ready; do not send a
workload while queued/learning/validating/publishing. See the
[complete preparation contract](../reference/preparation.md). The runnable examples
below explicitly perform both steps. They focus on startup flow; production REST
clients must implement the full schema/output validation or use an SDK.

Use uncompressed JSON first. Gzip requests must meet both compressed and decoded limits. Keep keys out of URLs and logs.

### Python

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.py).

```python
"""Preparation API example; use the SDK for complete contract validation."""
import json
import os
import random
import re
import time
import uuid
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

def prepare_and_wait(shape):
    # Exactly one POST. Reuse this key if implementing a deliberate POST retry.
    job = api_call("POST", "/v1/materials/prepare", shape, idempotency_key=uuid.uuid4().hex)
    ident = job.get("preparation_id") if isinstance(job, dict) else None
    if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", ident) or api_key in ident:
        raise RuntimeError("Invalid preparation ID")
    deadline = time.monotonic() + 60
    while True:
        if job.get("preparation_id") != ident or job.get("status_url") != "/v1/materials/preparations/" + ident:
            raise RuntimeError("Invalid preparation response")
        state = job.get("state")
        if state == "ready":
            ref = job.get("material_ref")
            if (job.get("execution_backend") != "rust" or not job.get("ready_until")
                    or not isinstance(ref, str) or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", ref) or api_key in ref):
                raise RuntimeError("Invalid readiness metadata")
            return job
        if state in ("failed", "expired"):
            raise RuntimeError("Preparation " + state + "; preparation ID: " + ident)
        if state not in ("queued", "learning", "validating", "publishing"):
            raise RuntimeError("Invalid preparation state")
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError("Preparation wait timed out; resume preparation ID: " + ident)
        try:
            job = api_call("GET", "/v1/materials/preparations/" + ident + "?wait=" + str(min(10, int(remaining))),
                timeout=remaining)
        except APIHTTPError as error:
            if error.status not in (408, 429, 500, 502, 503, 504):
                raise
            time.sleep(min(random.uniform(.05, .15), max(0, deadline - time.monotonic())))
            continue
        time.sleep(min(.01, max(0, deadline - time.monotonic())))

from pathlib import Path
shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
ready = prepare_and_wait(shape)
current = {name: value for name, value in shape.items() if name != "scripts"}
current["material_ref"] = ready["material_ref"]
result = api_call("POST", "/v1/shape", current)
print("Generated request:", result["request_id"])
# Apply result["headers"] using your existing target session and exact request.
```

### JavaScript

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.mjs).

```javascript
// Preparation API example; use an SDK for complete contract validation.
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
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
// One explicit POST with a stable key for this invocation; no automatic POST retry.
let job = await api('POST', '/v1/materials/prepare', shape, 45000, randomUUID())
const id = job.preparation_id
if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(id) || id.includes(apiKey))
  throw new Error('Invalid preparation ID')
const deadline = performance.now() + 60000
while (true) {
  if (job.preparation_id !== id || job.status_url !== `/v1/materials/preparations/${id}`)
    throw new Error('Invalid preparation response')
  if (job.state === 'ready') {
    if (job.execution_backend !== 'rust' || !job.ready_until ||
        typeof job.material_ref !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(job.material_ref))
      throw new Error('Invalid readiness metadata')
    break
  }
  if (['failed', 'expired'].includes(job.state)) throw new Error(`Preparation ${job.state}; preparation ID: ${id}`)
  if (!['queued', 'learning', 'validating', 'publishing'].includes(job.state)) throw new Error('Invalid preparation state')
  const remaining = deadline - performance.now()
  if (remaining <= 0) throw new Error(`Preparation wait timed out; resume preparation ID: ${id}`)
  try {
    job = await api('GET', `/v1/materials/preparations/${id}?wait=${Math.min(10, Math.floor(remaining / 1000))}`, undefined, remaining)
  } catch (error) {
    if (![408, 429, 500, 502, 503, 504].includes(error.status)) throw error
    await new Promise(resolve => setTimeout(resolve, Math.min(50 + Math.random() * 100, Math.max(0, deadline - performance.now()))))
  }
  await new Promise(resolve => setTimeout(resolve, Math.min(10, Math.max(0, deadline - performance.now()))))
}
const { scripts, ...current } = shape
const result = await api('POST', '/v1/shape', { ...current, material_ref: job.material_ref })
console.log('Generated request:', result.request_id)
// Apply result.headers using your existing target session and exact request.
```

### Go

[Source](https://github.com/Rayon-API/docs/blob/main/examples/rest.go).

```go
// Preparation API example; use an SDK for complete contract validation.
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
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
	var token [24]byte
	if _, err = rand.Read(token[:]); err != nil {
		panic("Unable to create preparation key")
	}
	// One explicit POST. Reuse this key if implementing a deliberate POST retry.
	job, status := api(context.Background(), "POST", "/v1/materials/prepare", shape, hex.EncodeToString(token[:]))
	if status != 200 && status != 202 {
		panic(fmt.Sprintf("Preparation HTTP %d", status))
	}
	id, _ := job["preparation_id"].(string)
	validID := regexp.MustCompile(`^[A-Za-z0-9_-]{16,128}$`)
	if !validID.MatchString(id) || strings.Contains(id, apiKey) {
		panic("Invalid preparation ID")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	for {
		if job["preparation_id"] != id || job["status_url"] != "/v1/materials/preparations/"+id {
			panic("Invalid preparation response")
		}
		state, _ := job["state"].(string)
		if state == "ready" {
			ref, _ := job["material_ref"].(string)
			if job["execution_backend"] != "rust" || job["ready_until"] == nil || !validID.MatchString(ref) || strings.Contains(ref, apiKey) {
				panic("Invalid readiness metadata")
			}
			break
		}
		if state == "failed" || state == "expired" {
			panic("Preparation " + state + "; preparation ID: " + id)
		}
		if state != "queued" && state != "learning" && state != "validating" && state != "publishing" {
			panic("Invalid preparation state")
		}
		deadline, _ := ctx.Deadline()
		remaining := time.Until(deadline)
		if remaining <= 0 {
			panic("Preparation wait timed out; resume preparation ID: " + id)
		}
		wait := int(remaining.Seconds())
		if wait > 10 {
			wait = 10
		}
		next, httpStatus := api(ctx, "GET", "/v1/materials/preparations/"+id+"?wait="+strconv.Itoa(wait), nil, "")
		if httpStatus != 200 {
			switch httpStatus {
			case 408, 429, 500, 502, 503, 504:
				var jitter [1]byte
				_, _ = rand.Read(jitter[:])
				timer := time.NewTimer(time.Duration(50+int(jitter[0])%100) * time.Millisecond)
				select {
				case <-ctx.Done():
					timer.Stop()
					panic("Preparation wait timed out; resume preparation ID: " + id)
				case <-timer.C:
				}
				continue
			default:
				panic(fmt.Sprintf("Preparation status HTTP %d", httpStatus))
			}
		}
		job = next
		timer := time.NewTimer(10 * time.Millisecond)
		select {
		case <-ctx.Done():
			timer.Stop()
			panic("Preparation wait timed out; resume preparation ID: " + id)
		case <-timer.C:
		}
	}
	delete(shape, "scripts")
	shape["material_ref"] = job["material_ref"]
	result, status := api(context.Background(), "POST", "/v1/shape", shape, "")
	if status != 200 {
		panic(fmt.Sprintf("Generation HTTP %d", status))
	}
	fmt.Println("Generated request:", result["request_id"])
	// Apply result["headers"] using your existing target session and exact request.
}
```

## 3. Send the target request

[Apply the returned headers](./applying-headers.md) using your target integration, preserving session state when the flow requires it. These examples call only RayonAPI; they do not collect scripts or send target requests.
