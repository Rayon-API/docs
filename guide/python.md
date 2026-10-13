# Python SDK

```sh
python -m pip install 'rayon-sdk-py>=1.0,<2'
```

Use a persistent client for multiple requests:

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

shape = json.loads(Path("shape-request.json").read_text())
with Client(os.environ["RAYON_API_KEY"], timeout=45) as client:
    result = client.generate(shape)
    usage = client.usage()
```

`shape-request.json` follows the [generation contract](../reference/shape.md). Read full protection source from your files rather than copying illustrative comments from the docs.

For asynchronous applications:

```python
from rayon_sdk_py import AsyncClient

async def generate_headers(shape, api_key):
    async with AsyncClient(api_key, timeout=45) as client:
        return await client.generate(shape)
```

The SDK exposes typed request/result models, validates response structure and raises structured errors for unsuccessful HTTP responses. It does not fetch target material or retry generation automatically. Close clients when finished to release connections.

`result.generation_ms` is server-side generation time. Measure elapsed time around `client.generate()` for the full latency your application sees, including upload and network time.
