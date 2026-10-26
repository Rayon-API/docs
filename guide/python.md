# Python SDK

Requires Python 3.10+. Keep API keys server-side. Preparation helpers are a
coordinated backend release preview; confirm availability before using them.

## 1. Install

```sh
python -m pip install 'rayon-sdk-py>=2.0.0,<3'
```

## 2. Prepare at startup with a persistent client

Start with the [Quickstart](./quickstart.md). Prepare `shape.json` using the shared [input guide](./preparation-walkthrough.md). Check free account usage before generation, then apply the result through your existing target integration.

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
with Client(os.environ["RAYON_API_KEY"], timeout=45) as client:
    usage = client.usage()  # Free; no generation quota used.
    ready = client.prepare_and_wait(shape, wait_timeout=60)
    current = {name: value for name, value in shape.items() if name != "scripts"}
    current["material_ref"] = ready.material_ref
    result = client.generate(current)
# Apply result.headers in your existing target session.
```

For async applications:

```python
from rayon_sdk_py import AsyncClient

async def run_integration(shapes, api_key):
    async with AsyncClient(api_key, timeout=45) as client:
        usage = await client.usage()  # Free check.
        for shape in shapes:
            ready = await client.prepare_and_wait(shape, wait_timeout=60)
            current = {name: value for name, value in shape.items() if name != "scripts"}
            current["material_ref"] = ready.material_ref
            result = await client.generate(current)
            # Apply the result through your existing target integration.
```

## 3. Handle results and errors

[Apply `result.headers`](./applying-headers.md) unchanged. Structured exceptions expose safe messages, codes and request IDs. SDK 1.1.3+ adds readable guidance from a trusted error catalog. Optional `reason`, `action`, `domain`, `field` and `billing_status` explain the next step. The SDK validates results, closes owned connections and never downloads target material. The material recovery behavior below is the only automatic generation retry.

```python
from rayon_sdk_py import RayonError

try:
    result = client.generate(shape)
except RayonError as error:
    print(str(error), error.action, error.request_id)
    # Check history before retrying if billing_status is pending or unknown.
```

`billing_status == "not_charged"` confirms no charge. An absent billing status is unknown. See [error and retry guidance](../reference/errors.md).

Keep one client open across requests. Python and JavaScript SDK 2.0.0 reuse material
in both modes and generate fresh telemetry each time. The shared [material policy](./material.md#4-reuse-source-with-a-material-reference)
covers retention, expiry, concurrent calls and the single confirmed uncharged recovery.
Other generation failures are not automatically retried. The one-shot helper closes
after one call, so use a persistent client for an integration.

Use `validate_profile(profile)` for offline validation. See the [SDK README](https://github.com/Rayon-API/rayon-sdk-py) for types and options.

`result.generation_ms` measures server generation. Time the complete `client.generate()` call to measure upload, network and API latency. A client timeout can occur after billing settlement; check usage/history before retrying.

Forward the complete returned header map unchanged, including optional same-family `a0`. Never append captured telemetry or split `a`.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; the SDK supports form mode.

[Python](./python.md) · [JavaScript / TypeScript](./javascript.md) · [Go](./go.md) · [Playwright](./playwright.md)

## Explicit preparation and resumable waits

Use `prepare(shape)` to start one job, `get_preparation(id, wait=0)` to inspect it,
`wait_until_ready(id, wait_timeout=60)` to wait, or `prepare_and_wait(shape)` to
combine the explicit steps. `AsyncClient` exposes all four with `await`.
`ReadyMaterial` contains metadata only. `PreparationError` exposes `kind` and
`preparation_id`; terminal kinds are `failed` and `expired`, and a bounded wait
can raise `timeout`. Polling errors also retain the safe job ID. Async wait
cancellation remains `asyncio.CancelledError` with a `preparation_id`; the server
job continues. No arbitrary generation retry or implicit prepare occurs.

Prepare the exact full context again when readiness expires or request/profile/
cookie/mode/form inputs change. An incomplete bundle or partial output never
establishes readiness. See [preparation states, lifetimes and planned migration](../reference/preparation.md).
