# Python SDK

Requires Python 3.10+. Keep API keys server-side.

## 1. Install

```sh
python -m pip install 'rayon-sdk-py>=1.1.4,<2'
```

## 2. Generate with a persistent client

Start with the [Quickstart](./quickstart.md). Prepare `shape.json` using the shared [input guide](./preparation-walkthrough.md). Check free account usage before generation, then apply the result through your existing target integration.

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
with Client(os.environ["RAYON_API_KEY"], timeout=45) as client:
    usage = client.usage()  # Free; no generation quota used.
    result = client.generate(shape)
# Apply result.headers in your existing target session.
```

For async applications:

```python
from rayon_sdk_py import AsyncClient

async def run_integration(shapes, api_key):
    async with AsyncClient(api_key, timeout=45) as client:
        usage = await client.usage()  # Free check.
        for shape in shapes:
            result = await client.generate(shape)
            # Apply the result through your existing target integration.
```

## 3. Handle results and errors

[Apply `result.headers`](./applying-headers.md) unchanged. Structured exceptions expose safe messages, codes and request IDs. SDK 1.1.3+ adds readable guidance from a trusted error catalog. Optional `reason`, `action`, `domain`, `field` and `billing_status` explain the next step. The SDK validates results, closes owned connections and never downloads target material. The material recovery behavior below is the only automatic retry.

```python
from rayon_sdk_py import RayonError

try:
    result = client.generate(shape)
except RayonError as error:
    print(str(error), error.action, error.request_id)
    # Check history before retrying if billing_status is pending or unknown.
```

`billing_status == "not_charged"` confirms no charge. An absent billing status is unknown. See [error and retry guidance](../reference/errors.md).

Keep one client open across requests. Python and JavaScript SDK 1.1.4 reuse material
in both modes and generate fresh telemetry each time. The shared [material policy](./material.md#4-reuse-source-with-a-material-reference)
covers retention, expiry, concurrent calls and the single confirmed uncharged recovery.
Other generation failures are not automatically retried. The one-shot helper closes
after one call, so use a persistent client for an integration.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-py) for types and options.

`result.generation_ms` measures server generation. Time the complete `client.generate()` call to measure upload, network and API latency. A client timeout can occur after billing settlement; check usage/history before retrying.

Forward the complete returned header map unchanged, including optional same-family `a0`. Never append captured telemetry or split `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; the SDK supports form mode.

[Python](./python.md) · [JavaScript / TypeScript](./javascript.md) · [Go](./go.md) · [Playwright](./playwright.md)
