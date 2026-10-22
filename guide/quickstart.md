# Quickstart

Use an SDK with your existing HTTP client or browser. The same input and application
steps apply to Python, JavaScript / TypeScript, Go and Playwright integrations.

## 1. Create an API key

Open the [dashboard](https://dashboard.rayonapi.com), accept the current policies,
request approval for your source and endpoint domains, then create a key. Store it
server-side as `RAYON_API_KEY`.

Join [Discord](https://discord.gg/TwhkJNyHWs) and claim 1,000 free requests in the
dashboard. One claim per Discord identity. See [usage and access](../reference/usage.md)
for allowance details; the first check below is free.

## 2. Install your SDK

| Integration | Install / guide |
| --- | --- |
| Python 3.10+ | `python -m pip install 'rayon-sdk-py>=1.1.4,<2'` · [Python](./python.md) |
| Node.js 20.18.1+ | `npm install rayon-sdk-js@^1.1.4` · [JavaScript / TypeScript](./javascript.md) |
| Go 1.23+ | `go get github.com/Rayon-API/rayon-sdk-go@v1.0.0` · [Go](./go.md) |
| Existing Playwright page | `npm install rayon-sdk-playwright@^0.1.0 playwright-core` · [Playwright](./playwright.md) |

## 3. Check usage for free

Create one SDK client and call `usage()` before generating. Usage reads do not
consume generation quota. The [language guides](./python.md) show the same sequence
for each client. For example:

## 4. Prepare inputs

Follow the [input guide](./preparation-walkthrough.md): source-page URL, complete
ordered script sources, a profile object and the exact target request. Save these
as `shape.json` or construct the equivalent object in your application.

Use browser measurements and JavaScript-visible cookies only when required by your
flow. Keep application authentication, cookies, proxy and transport settings in your
existing integration. The [optional Python helper](https://github.com/Rayon-API/rayon-examples)
can download explicit script URLs when useful; it is not required for SDK setup.

## 5. Generate and apply

Use one persistent client to check usage and generate from your prepared inputs:

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

with Client(os.environ["RAYON_API_KEY"]) as client:
    print(client.usage())  # Free check before generation.
    shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
    result = client.generate(shape)
    # Apply result.headers using your existing target client.
    # Reuse client here for further requests with their current inputs.
```

[Apply every returned header](./applying-headers.md) unchanged, including optional
`a0`. For observed form telemetry, use [Form payload integration](../form-payload-integration.md)
instead. Inspect the target response: generation does not establish target acceptance.

Reuse the SDK client across calls, updating request and session inputs as needed.
See [material reuse](./material.md#4-reuse-source-with-a-material-reference) and
[errors](../reference/errors.md) for reference lifetime, bounded recovery and uncertain
billing outcomes. Direct [REST](./rest.md) is an advanced fallback when you need to
implement the API contract yourself.
