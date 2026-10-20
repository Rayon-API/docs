# Python SDK

Requires Python 3.10+. Keep API keys server-side.

## 1. Install

```sh
python -m pip install 'rayon-sdk-py>=1.1.4,<2'
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

SDK 1.1.4+ persistent clients retain original source in memory (at most 128 bundles and 16 MiB per client), reuse references for identical ordered material, and refresh on the next generation within five seconds of expiry. Concurrent callers share the material upload; every caller still generates its own result with current inputs. There is no background generation. After a definite HTTP 422 `material_expired` response with `billing_status: "not_charged"`, the client retries once with retained source. Other errors and ambiguous billing outcomes are never retried automatically. Reference-only recovery requires source still retained in the same client; keep your own source copy. Closing the client clears retained source. The one-shot `generate(shape, api_key)` helper closes after one call.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-py) for types and options.

`result.generation_ms` measures server generation. Time the complete `client.generate()` call to measure upload, network and API latency. A client timeout can occur after billing settlement; check usage/history before retrying.

SDK 1.1.0+ supports six required headers with optional same-family `a0`. Upgrade older SDKs, which require exactly six headers. Forward the complete returned map unchanged, without appending captured `a0` or splitting `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode is supported by SDK 1.1.0+ and direct REST.
