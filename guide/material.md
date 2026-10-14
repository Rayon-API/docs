# Download protection material

## 1. Choose the URLs

Use [browser Network inspection](./preparation-walkthrough.md) to select the protection loader, payload and required dependencies in execution order. Preserve complete URLs, including seeds and query strings. Replace the reserved example URLs below with those you observed.

## 2. Download through one target session

```sh
python -m pip install curl_cffi
```

Set `CHROME_PROFILE` to a browser profile supported by [curl_cffi](https://curl-cffi.readthedocs.io/en/latest/api.html) that matches your measured browser. Set `RAYON_TARGET_PROXY` when you use a sticky proxy.

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

A JavaScript MIME type and HTTP 200 are preliminary checks. Compare the source with the observed protection response; neither proves you collected the correct or complete bundle. Resolve relative URLs against the actual source page. Inspect redirects explicitly rather than following them with session credentials.

Keep complete decoded source, without trimming, beautifying or replacing it with comments. If decoding fails or a site serves scripts with another content type, inspect its actual encoding/content before adapting the checks.

## 3. Keep cookies and context current

The session owns your cookie jar. `material.json` does not save cookies, proxy settings or login state; do not restart with a fresh session and assume the file restores them.

If the protection reads `document.cookie`, supply `document_cookie` containing current JavaScript-visible cookies for the source document. Exclude HttpOnly cookies and cookies outside that document's domain/path scope. An empty string is the default. Do not flatten the full jar into this field.

Use the measured [profile](./profiles.md) and exact [request fields](../reference/shape.md). RayonAPI never fetches missing scripts or network dependencies.

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

Supply exactly one of `scripts` and `material_ref`. References expire after five minutes and can disappear earlier after eviction/restart. Retain source to upload again after `material_expired`. Every generation still needs current request, profile and cookie inputs.

Source limits: 16 scripts, 2 MiB each, 3 MiB total. See [all limits](../reference/shape.md#input-limits).

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode requires SDK 1.1.0 when published, or direct REST.
