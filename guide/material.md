# Material options

For supported public header flows, omit both `scripts` and `material_ref`.
Rayon selects current material from its maintained public sources. Keep them
omitted on every call so updates are selected automatically. Start with the
[quickstart](./quickstart.md).

Registered public mappings can be reused across accounts. Uploads and references
remain private to the API key; they are not added to the public registry.
The source URL selects a registered source, not an arbitrary on-demand download.

## Optional explicit override

Supply either complete `scripts` or a valid private `material_ref` when you need
to choose material yourself. Explicit fields override automatic selection.
Form mode currently requires one of these inputs. Null, empty fields and both
fields together are invalid. The collection example below is optional.

For an inline script override, use `{url: document_url, source: full_source, inline: true}`. Omit `inline` for external scripts.

## 1. Choose the URLs

Select the protection loader, payload and required dependencies in execution order. If you need to identify them, [Network inspection](./preparation-walkthrough.md#1-prepare-the-script-sources-and-request) can help. Preserve complete URLs, including seeds and query strings. Replace the reserved example URLs below with those for your flow.

## 2. Optional: Download through one target session

```sh
python -m pip install curl_cffi
```

This example chooses `curl_cffi` as its target client. Set `CHROME_PROFILE` to a supported [curl_cffi impersonation profile](https://curl-cffi.readthedocs.io/en/latest/api.html) appropriate to your flow, with matching supplied profile values. Set `RAYON_TARGET_PROXY` if that flow uses a proxy. These are settings for this example, not required SDK or API inputs.

```python
import json
import os
from pathlib import Path
from curl_cffi import CurlOpt, requests

profile = json.loads(Path("profile.json").read_text(encoding="utf-8"))
source_url = "https://shop.example.com/account"
protection_urls = [
    "https://shop.example.com/assets/protection-loader.js",
    "https://shop.example.com/assets/protection-payload.js?seed=observed",
]
proxy = os.environ.get("RAYON_TARGET_PROXY") or None
user_agent = profile.get("user_agent") or profile["navigator"]["userAgent"]
target_session = requests.Session(
    impersonate=os.environ["CHROME_PROFILE"],
    proxy=proxy,
    curl_options={} if proxy else {CurlOpt.PROXY: ""},
    trust_env=False,
    headers={"User-Agent": user_agent},
)
# Use this same session for required application login/state setup.
page = target_session.get(source_url, allow_redirects=False, timeout=30)
page.raise_for_status()
if page.status_code != 200:
    raise ValueError("Inspect the source-page redirect or response first")

scripts = []
for script_url in protection_urls:
    response = target_session.get(script_url, allow_redirects=False, timeout=30)
    response.raise_for_status()
    media_type = response.headers.get("Content-Type", "").split(";")[0].strip().lower()
    source = response.content.decode(response.encoding or "utf-8", errors="strict")
    if (response.status_code != 200 or not source.strip()
            or "html" in media_type or source.lstrip().startswith("<")):
        raise ValueError("Expected JavaScript; inspect redirect/challenge response")
    if media_type not in {
        "application/javascript", "text/javascript", "application/x-javascript",
    }:
        raise ValueError("Inspect unexpected script content type before proceeding")
    scripts.append({"url": script_url, "source": source})

material = {"source_url": source_url, "scripts": scripts}
Path("material.json").write_text(json.dumps(material, ensure_ascii=False), encoding="utf-8")
# Generate and apply headers before closing target_session.
```

A JavaScript MIME type and HTTP 200 are preliminary checks. Compare the source with the expected protection response; neither proves you collected the correct or complete bundle. Resolve relative URLs against the actual source page. Inspect redirects explicitly rather than following them with session credentials.

Keep complete decoded source, without trimming, beautifying or replacing it with comments. If decoding fails or a site serves scripts with another content type, inspect its actual encoding/content before adapting the checks.

## 3. Keep cookies and context current

For flows that require session state, the target session owns the cookie jar. `material.json` does not save cookies, proxy settings or login state; a fresh session does not restore that state from this file. Keep the same target session open through sending when the flow binds material to it.

If the protection reads `document.cookie`, supply `document_cookie` containing current JavaScript-visible cookies for the source document. Exclude HttpOnly cookies and cookies outside that document's domain/path scope. An empty string is the default. Do not flatten the full jar into this field.

Use a [profile](./profiles.md) appropriate to the represented environment and exact [request fields](../reference/shape.md). Explicit uploads must include required dependencies; they are not fetched during generation.

## 4. Reuse source with a material reference

A successful result provides a key-scoped reference valid for the original source context:

```python
next_shape = {
    "source_url": shape["source_url"],
    "material_ref": result.material_ref,
    "profile": current_profile,
    "document_cookie": current_document_cookie,
    "request": next_request,
}
```

For an explicit override, supply exactly one of `scripts` and `material_ref`. References are scoped to the
API key and original source URL, last up to five minutes and can expire earlier after
eviction or restart. Use `material_expires_at`; uploading identical material need not
extend its expiry. Each generation still uses current profile, request and cookie inputs.

Python and JavaScript SDK 2.1.0 clients retain original source in memory (up to 128
bundles and 16 MiB per client). Identical ordered sources reuse a reference in header
and form modes. Within five seconds of expiry, the next call uploads retained sources
again; concurrent callers share the upload and then generate their own results. There
is no background generation or target-script download.

A definite HTTP 422 `material_expired` with `billing_status: "not_charged"` receives
one recovery attempt with retained source. Reference-only recovery requires the source
to remain in that same client. Other generation failures are not automatically retried;
timeouts and uncertain billing require checking request history first. A failed upload
fails queued callers before generation; cancelling a queued caller does not cancel the
owner's upload.

Retention ends on eviction or close and is not shared between clients, API keys or API
hosts. Keep your own source copy. See [errors](../reference/errors.md) for billing and
retry guidance.

Source limits: 16 scripts, 2 MiB each, 3 MiB total. See [all limits](../reference/shape.md#input-limits).

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode is supported by the SDKs.


## 5. Keep source reuse separate from readiness

A source reference is not a readiness guarantee. Optional preparation checks the
supplied explicit context before a workload. Usable validated mappings may be
ready with defaulted internal records; required output validation still applies.
`ready_until` bounds readiness separately from `material_expires_at`. See the
[preparation contract](../reference/preparation.md).

Automatic generation does not need this lifecycle. Keep material omitted rather
than copying a returned reference into later automatic requests.
