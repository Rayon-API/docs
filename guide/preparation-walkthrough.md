# Prepare your first integration

Use an authorized browser session and its matching HTTP client. RayonAPI receives protection material; it does not discover scripts or open the site for you.

## 1. Select the protection scripts

Open Chrome DevTools → Network, enable **Preserve log**, and perform your intended action. Select the application request that carries telemetry. Inspect its **Initiator** chain and the JavaScript requests responsible for that instrumentation. Keep the required loader, payload and dependencies in execution order.

Record each complete script URL, including query parameters. Download the actual sources using that same authorized session. Check status, content type and body: HTML challenge pages are not script material. An initiator chain is a starting point, not proof that every script in it is required.

Save `material.json` using the [material format](./material.md). Keep it outside Git and shared logs.

## 2. Measure the browser profile

On that source page, paste the [profile collector](https://docs.rayonapi.com/examples/capture-profile.js) into DevTools. It reads browser identity, dimensions and available unmasked WebGL values, then copies JSON to your clipboard. Save the JSON as `profile.json`.

The collector does not alter browser properties, fetch URLs or collect cookies. Unavailable WebGL values are omitted. It does not supply protection-specific canvas pixels; obtain those separately if your integration needs them. An HTTP client's TLS fingerprint must still match the browser profile.

Validate the file locally:

```python
import json
from pathlib import Path
from rayon_sdk_py import validate_profile

profile = validate_profile(json.loads(Path("profile.json").read_text(encoding="utf-8")))
```

## 3. Keep the request exact

Record the final endpoint URL, method, content type and exact UTF-8 body string. Preserve its application headers and scoped cookie jar in your target client. If the scripts need `document.cookie`, supply only current JavaScript-visible values from the source page; exclude HttpOnly cookies.

Use these inputs in the [quickstart](./quickstart.md), then [apply the headers](./applying-headers.md) to the same request. Both source and endpoint domains need approved API access. Separate API subdomains are supported when explicitly approved; avoid wildcard forwarding.

## 4. Check the target response

HTTP 200 from RayonAPI means generation succeeded. Check the target's own response for challenges, application errors and authentication failures. Keep request IDs for support; share redacted diagnostics rather than scripts, cookies, generated headers or credentials.
