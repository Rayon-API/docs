# Quickstart

The additive preparation API is available. Prepare the full current context and
wait for ready before starting a workload. Mandatory preparation is not enabled;
a 30-day migration window and cutoff will be announced separately. No cutoff date
is set. See the
[preparation contract](../reference/preparation.md).

Use an SDK with your existing HTTP client or browser. The same input and application
steps apply to Python, JavaScript / TypeScript, Go and Playwright integrations.

## 1. Create an API key

Open the [dashboard](https://dashboard.rayonapi.com), accept the current policies,
request approval for your source and endpoint domains, then create a key. Store it
server-side as `RAYON_API_KEY`.

Join [Discord](https://discord.gg/TwhkJNyHWs) and claim 1,000 free requests in the
dashboard. One claim per Discord identity. See [usage and access](../reference/usage.md) for
allowance details; the first check below is free.

## 2. Install your SDK

| Integration | Install / guide |
| --- | --- |
| Python 3.10+ | `python -m pip install 'rayon-sdk-py>=2.0.0,<3'` · [Python](./python.md) |
| Node.js 20.18.1+ | `npm install rayon-sdk-js@^2.0.0` · [JavaScript / TypeScript](./javascript.md) |
| Go 1.23+ | `go get github.com/Rayon-API/rayon-sdk-go/v2@v2.0.0` · [Go](./go.md) |
| Existing Playwright page | `npm install rayon-sdk-playwright@^1.0.0 playwright-core` · [Playwright](./playwright.md) |

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

## 5. Prepare, wait, then generate and apply

Use one persistent client to check usage, explicitly prepare the exact full context
at startup, and wait for complete readiness before beginning the workload:

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

with Client(os.environ["RAYON_API_KEY"]) as client:
    print(client.usage())  # Free check before generation.
    shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
    ready = client.prepare_and_wait(shape, wait_timeout=60)
    current = {name: value for name, value in shape.items() if name != "scripts"}
    current["material_ref"] = ready.material_ref
    result = client.generate(current)
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

Preparation fails when only partial material/output is available. A successful wait
returns safe readiness metadata with the `rust` backend; it contains no old
headers to replay. `generate` never prepares or waits implicitly. Resume an
interrupted wait by its safe preparation ID, and prepare again after readiness
expiry or relevant full-context changes. See [states, expiry and migration](../reference/preparation.md).
