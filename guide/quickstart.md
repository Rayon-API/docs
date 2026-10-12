# Quickstart

## Get access

1. Open the [RayonAPI dashboard](https://dashboard.rayonapi.com) and request access.
2. Request approval for the target domain and accept the current policies.
3. Create an API key. It is shown once; store it securely when it appears.

Use an environment variable such as `RAYON_API_KEY`. Keep keys out of URLs, source control, request logs, and shared screenshots. A solve must use an approved target domain.

## Install an SDK

Registry releases are not available yet. Install from source for now:

::: code-group

```sh [Python]
python -m pip install "git+https://github.com/Rayon-API/rayon-sdk-py.git"
```

```sh [JavaScript]
git clone https://github.com/Rayon-API/rayon-sdk-js.git
cd rayon-sdk-js
npm ci
npm run build
npm pack
# From your application directory, install the resulting .tgz:
# npm install /path/to/rayon-sdk-js/rayon-sdk-js-0.1.0.tgz
```

:::

See the [Python](./python.md) and [JavaScript](./javascript.md) guides for the package commands to use after `0.1.0` is published.

## Make your first solve

Replace the illustrative URL below with the real page that initiates your authorized workflow on an approved domain.

```python
import os
from rayon_sdk_py import RayonError, SolveFailedError, solve

try:
    result = solve(
        "https://example.com/start",
        os.environ["RAYON_API_KEY"],
        timeout=150,
    )
except SolveFailedError:
    raise SystemExit("Capture failed or was rejected")
except RayonError:
    raise SystemExit("API request failed; inspect the error safely")

# Use result.headers and result.cookies in a scoped target client.
```

An HTTP error and an unsuccessful capture are different outcomes. A valid HTTP `200` response can contain `status: "failed"`. The SDK raises `SolveFailedError` for unsuccessful capture; direct REST callers must check the JSON status themselves. A successful fallback can retain earlier diagnostics in `errors`.

## Prepare the target client

Read the [core requirements](./requirements.md) before replaying anything. Your downstream request needs browser-grade TLS, a consistent client profile, stable egress, and correctly scoped cookies. The SDK's transport to RayonAPI does not configure your transport to the target website.

Continue with [Shape / F5](./shape-f5.md) for telemetry-specific guidance or the [API reference](../reference/solve.md) for the complete contract.
