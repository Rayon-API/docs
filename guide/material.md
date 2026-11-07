# Material options

For supported public header flows, omit both `scripts` and `material_ref`.
Rayon selects current material from its maintained public sources. Keep them
omitted on every call so updates are selected automatically. Start with the
[quickstart](./quickstart.md).

Registered public mappings can be reused across accounts. Uploads and references
remain private to the API key; they are not added to the public registry.
The source URL selects a registered source, not an arbitrary on-demand download.

## Custom material requires preparation

Custom sources are accepted by `POST /v1/materials/prepare`, never by `/v1/shape`.
Wait for `state: ready`, then solve with the private reference.
Header calls may instead omit both fields for ready managed material. Form calls
require a ready private reference.

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

## 4. Prepare, wait and use a ready reference

```python
# explicit_shape contains complete scripts and the intended profile/request context.
ready = client.prepare_and_wait(explicit_shape, wait_timeout=60)
context = {k: v for k, v in explicit_shape.items() if k not in ("scripts", "material_ref")}
result = client.generate({**context, "material_ref": ready.material_ref})
```

A queued preparation may already contain a reference. Use it only after `state`
is `ready`. Readiness confirms its supported
input scope and availability, not downstream acceptance or every possible input.

## 5. Refresh outside generation

Retain sources for preparation. Refresh before the earlier of `ready_until` and
`material_expires_at`, or when your supported deployment changes. Replace the
previous reference only after the new one is ready. Never extend the old lease.
Changing request/profile inputs must remain within the validated input scope.

Generation never uploads sources, starts preparation or retries automatically. Expired or incompatible references return explicit errors. See
[preparation](../reference/preparation.md) and [errors](../reference/errors.md).

A changed loader may require fresh preparation even when the payload is unchanged.
Keep the complete source bundle current.
Private references remain scoped to their key and source context.

Preparation limits remain 16 scripts, 2 MiB each and 3 MiB total. Managed calls
keep both material fields omitted across rotation and do not need customer refresh.
