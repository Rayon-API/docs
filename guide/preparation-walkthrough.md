# Collect inputs and prepare your first request

Prepare these inputs in your existing integration, then pass them to an SDK. Use browser capture or downloads only for inputs your flow still needs. The SDK and API do not discover or download scripts.

## Collected SDK inputs

### 1. Prepare the script sources and request

| Input | What to supply |
| --- | --- |
| `source_url` | The page where the protection executes. It provides context and is never fetched by the API. |
| `scripts` | The required protection scripts in execution order, each with its complete URL and full decoded JavaScript `source`. |
| `profile` | A supported profile object representing the environment for your flow. See the next step. |
| `request` | Exact `url`, `method`, `content_type` and UTF-8 `body`; include all four fields. GET/HEAD use a null body. |
| `document_cookie` | Optional current JavaScript-visible source-document cookies, only when needed by the protection. Default: empty string. |

Use scripts you already have or download the selected sources with your integration's HTTP client. Preserve complete URLs, including query parameters, and complete source without trimming or beautifying. A URL alone does not tell RayonAPI to download a script. See [material preparation](./material.md) for an optional download example and limits.

If you need to identify the scripts, browser DevTools is one way to inspect the real flow: enable **Preserve log** in **Network**, perform the intended action, then inspect the protected request, its **Initiator** chain and nearby JavaScript responses. Record required loader, payload and dependencies in execution order. An initiator chain is evidence to inspect; uploading every script on a page does not establish a correct bundle.

Record the target request's URL, method, content type and exact body. Keep application authentication, CSRF tokens and other required headers in your target integration. A browser session, cookie import, proxy or particular HTTP transport is only needed when that target flow requires it.

### 2. Prepare a profile

Save your supported profile values in `profile.json`. Supplied values must match the environment represented by your integration. Omitted fields use emulation defaults, which are not measurements of your client. Supply actual screen, navigator, WebGL or canvas values when the protection depends on them; see [supported fields](./profiles.md).

If you need values from an existing browser environment, the optional [profile capture snippet](/examples/capture-profile.js) reads identity, dimensions and available WebGL values. Run it as a DevTools **Sources → Snippets** snippet on the source page, then save its copied JSON as `profile.json`. It omits unavailable GPU values, cookies and protection-specific canvas pixels; collect those separately only if needed. Existing profile values do not require a new browser capture.

Validate the file offline:

```python
import json
from pathlib import Path
from rayon_sdk_py import validate_profile

profile = validate_profile(json.loads(Path("profile.json").read_text(encoding="utf-8")))
```

Validation checks supplied fields; it does not measure an environment or configure your target HTTP client's identity.

### 3. Assemble `shape.json`

This example reads two prepared script files and the exact UTF-8 request body. Replace the example URLs and file names with your own approved flow:

```python
import json
from pathlib import Path

shape = {
    "source_url": "https://shop.example.com/account",
    "scripts": [
        {
            "url": "https://shop.example.com/assets/protection-loader.js",
            "source": Path("loader.js").read_bytes().decode("utf-8"),
        },
        {
            "url": "https://shop.example.com/assets/protection-payload.js?seed=observed",
            "source": Path("payload.js").read_bytes().decode("utf-8"),
        },
    ],
    "profile": json.loads(Path("profile.json").read_text(encoding="utf-8")),
    "request": {
        "url": "https://shop.example.com/api/username",
        "method": "POST",
        "content_type": "application/json",
        "body": Path("request-body.txt").read_bytes().decode("utf-8"),
    },
}
Path("shape.json").write_text(json.dumps(shape, ensure_ascii=False), encoding="utf-8")
```

When needed, add `document_cookie` with current JavaScript-visible cookies for the source document. Exclude HttpOnly cookies and cookies outside that document's domain/path scope. Keep cookies and material current for flows that bind them to a session.

Continue with the [SDK quickstart](./quickstart.md#5-prepare-wait-then-generate-and-apply). Reuse the SDK client across generations, update the request and other changing inputs each time, and apply the result using your target integration. Preserve the exact body string: whitespace, key order and Unicode bytes matter. For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md); both SDKs and direct REST support it.

## Optional Python download helper

Use the [examples workflow](https://github.com/Rayon-API/rayon-examples/blob/main/docs/workflow.md)
when you want explicitly selected script downloads and optional target sending through
one `curl_cffi` session. It is optional; keep your current integration when it already
provides these inputs. The workflow reference covers config, cookie scope, form mode,
allowed origins, offline validation and explicit network flags.

## 4. Prepare on the server before starting the workload

Collection and local validation do not establish server readiness. In the
coordinated release preview, explicitly prepare the full ShapeRequest and wait
for `ready` before generation. The server validates complete requested outputs;
partial material or partial output fails preparation. Readiness belongs to the
exact source/profile/request/cookie/mode/form context and expires independently
of a source reference. Follow the [quickstart](./quickstart.md) and
[preparation contract](../reference/preparation.md) for methods and migration status.
