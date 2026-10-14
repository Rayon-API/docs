# Python SDK

Requires Python 3.10+. Keep API keys server-side.

## 1. Install

```sh
python -m pip install 'rayon-sdk-py>=1.0,<2'
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

[Apply `result.headers`](./applying-headers.md) unchanged. Structured exceptions expose sanitized error codes and request IDs. The SDK validates results, closes owned connections and never downloads target material or retries generation automatically.

Persistent clients remember unexpired references for identical ordered material. After `material_expired`, use a fresh client with retained scripts and current context so a cached reference is not selected again. The one-shot `generate(shape, api_key)` helper closes after one call.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-py) for types and options.

`result.generation_ms` measures server generation. Time the complete `client.generate()` call to measure upload, network and API latency. A client timeout can occur after billing settlement; check usage/history before retrying.
