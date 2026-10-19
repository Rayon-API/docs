# Python SDK

Requires Python 3.10+. Keep API keys server-side.

## 1. Install

```sh
python -m pip install 'rayon-sdk-py>=1.1.3,<2'
```

## 2. Generate with a persistent client

Prepare `shape.json` using the [collection guide](./preparation-walkthrough.md) and [request contract](../reference/shape.md).

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
with Client(os.environ["RAYON_API_KEY"], timeout=45) as client:
    result = client.generate(shape)
    usage = client.usage()
# Apply result.headers in your existing target session.
```

For async applications:

```python
from rayon_sdk_py import AsyncClient

async def generate_headers(shape, api_key):
    async with AsyncClient(api_key, timeout=45) as client:
        return await client.generate(shape)
```

## 3. Handle results and errors

[Apply `result.headers`](./applying-headers.md) unchanged. Structured exceptions expose safe messages, codes and request IDs. SDK 1.1.3+ adds readable guidance from a trusted error catalog. Optional `reason`, `action`, `domain`, `field` and `billing_status` explain the next step. The SDK validates results, closes owned connections and never downloads target material or retries generation automatically.

```python
from rayon_sdk_py import RayonError

try:
    result = client.generate(shape)
except RayonError as error:
    print(str(error), error.action, error.request_id)
    # Check history before retrying if billing_status is pending or unknown.
```

`billing_status == "not_charged"` confirms no charge. An absent billing status is unknown. See [error and retry guidance](../reference/errors.md).

Persistent clients remember unexpired references for identical ordered material. After `material_expired`, use a fresh client with retained scripts and current context so a cached reference is not selected again. The one-shot `generate(shape, api_key)` helper closes after one call.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-py) for types and options.

`result.generation_ms` measures server generation. Time the complete `client.generate()` call to measure upload, network and API latency. A client timeout can occur after billing settlement; check usage/history before retrying.

SDK 1.1.0+ supports six required headers with optional same-family `a0`. Upgrade older SDKs, which require exactly six headers. Forward the complete returned map unchanged, without appending captured `a0` or splitting `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode is supported by SDK 1.1.0+ and direct REST.
