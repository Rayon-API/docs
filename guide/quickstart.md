# Quickstart

Rayon manages material for supported public sources. Send your source-page URL,
profile and exact request. You do not need to collect scripts or prepare material.

## 1. Create an API key

Open the [dashboard](https://dashboard.rayonapi.com), complete setup, request access
for your source and endpoint domains, then create a key. Store it server-side as
`RAYON_API_KEY`. Join [Discord](https://discord.gg/TwhkJNyHWs) to claim 1,000 free
requests in the dashboard, once per Discord identity.

## 2. Install your SDK

| Integration | Install / guide |
| --- | --- |
| Python 3.10+ | `python -m pip install 'rayon-sdk-py>=2.1.0,<3'` · [Python](./python.md) |
| Node.js 20.18.1+ | `npm install rayon-sdk-js@^2.1.0` · [JavaScript / TypeScript](./javascript.md) |
| Go 1.23+ | `go get github.com/Rayon-API/rayon-sdk-go/v2@v2.1.0` · [Go](./go.md) |
| Playwright integration | `npm install rayon-sdk-playwright@^1.1.0 playwright-core` · [Playwright](./playwright.md) |

## 3. Generate

Replace the reserved example URLs with your approved source and endpoint.
`profile: {}` uses defaults; supply measured values when your flow needs them.

```python
import os
from rayon_sdk_py import Client

with Client(os.environ["RAYON_API_KEY"]) as client:
    print(client.usage())  # Free access and allowance check.
    result = client.generate({
        "source_url": "https://shop.example.com/account",
        "profile": {},
        "request": {
            "url": "https://shop.example.com/api/check",
            "method": "POST",
            "content_type": "application/json",
            "body": "{}",
        },
    })
    if result.fallback_reason:
        print("A fallback was used. Contact support with request ID:", result.request_id)
    # Apply result.headers through your existing target client.
    # Keep this client open for further requests.
```

## 4. Apply every returned header

Forward the entire header map unchanged, including optional `a0`, to that exact
request. Keep application authentication, cookies and transport in your own
client. Generate fresh telemetry for each request. Inspect the target response
for acceptance. See [applying headers](./applying-headers.md).

Keep both `scripts` and `material_ref` omitted on later automatic requests so
Rayon can select updated material. Registered public material is maintained by
Rayon; this does not fetch arbitrary URLs on demand. Your profile, request body
and session inputs still need to match your flow.

[Optional material overrides](./material.md) and [preparation](../reference/preparation.md)
remain available. [Form mode](../form-payload-integration.md) currently needs
explicit material. For unsupported sources or fallback, contact support with
the request ID. Check [errors and billing](../reference/errors.md) before retrying.
