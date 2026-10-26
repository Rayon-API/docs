# Form payload integration

Form mode generates URL-encoded telemetry for supported material. Use it when the observed protected request carries Shape telemetry in its URL-encoded body. Header mode remains the default. Both use `POST /v1/shape`.

The documented six-field response applies to supported material. Sites may use other families; inspection alone does not establish compatibility. Unsupported or incomplete output returns an error. Generation success does not guarantee target acceptance.

## Inspect the request first

In browser DevTools, preserve the Network log and inspect **Payload → Form Data** as well as request headers. Record the endpoint, POST method, `application/x-www-form-urlencoded` content type, exact encoded application body, form ID/name when relevant, and current cookies/CSRF state. Use the raw source view to preserve encoding and order.

Form field names can differ from header names. Their separator and exact case also vary: the illustrative family `site-fielda/b/c/d/f/z` has no separator before its suffix. Never derive names by rewriting a header prefix. Download the [complete ordered material](./guide/material.md) and use a [measured profile](./guide/profiles.md) from the same session.

## Prepare material and session state

Follow [material collection](./guide/preparation-walkthrough.md) and [download scripts](./guide/material.md) to fetch the source page and full loader, payload and required dependencies through one target session. Preserve their observed execution order and complete URLs/query strings. Resolve HTML challenges or redirects before generation; Rayon never fetches missing scripts or the target endpoint.

Save a measured `profile.json` with the [profile collector](./guide/profiles.md). Keep the same browser identity and sticky transport throughout. Supply only the source document's current JavaScript-visible `document.cookie` as `document_cookie`; it excludes HttpOnly cookies. The full scoped HTTP cookie jar, authentication and login state stay in your target client. Refresh CSRF and cookie inputs when the application changes them.

For the selected form, record the effective action URL, method and encoding used by the clicked submit control, including any `formaction`, `formmethod` or `formenctype` override. Include its `name=value` pair when the browser sends it. Save the application's exact raw encoded body as `request-body.txt`; do not turn it into a dictionary. Record observed form ID/name and required application headers separately.

## Generate form telemetry

Prepare `shape.json` with your actual downloaded scripts (or a valid `material_ref`), measured profile and current JavaScript-visible `document_cookie`. The following excerpt shows the additional fields; it is not a complete request:

```json
{
  "mode": "form",
  "form": { "id": "account-form", "name": "account" },
  "request": {
    "url": "https://shop.example.com/account",
    "method": "POST",
    "content_type": "application/x-www-form-urlencoded",
    "body": "item=first&item=second&empty=&csrf=a%2Bb&name=caf%C3%A9"
  }
}
```

`request.body` is your application's exact encoded body **before telemetry insertion**. An empty string is valid; null is not. A single UTF-8 charset parameter is allowed in the content type. Preserve duplicate fields, empty values and field order. Replace only stale telemetry tokens from an earlier generation, using their observed exact names; retain application fields, CSRF and cookies. Do not submit a stale complete telemetry family as application input.

`form` is optional; its `id` and `name` identify the observed form when the material needs a selector. Each is a string of at most 256 characters without control characters. Do not send `form` in header mode.

```sh
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/shape \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @shape.json
```

The API envelope stays JSON; `request.content_type` describes the later target request. Form input is limited to 256 KiB UTF-8, 1,024 decoded pairs and 256 UTF-8 bytes per field name. Malformed percent escapes, invalid UTF-8 and NUL are rejected. See [request fields and limits](./reference/shape.md).

Before the synthetic submit, form mode allows eligible short initialization callbacks to settle, including chained zero-delay and animation-frame callbacks. This readiness phase stops when they settle and is bounded by 500 ms and the execution deadline; it does not wait for long-running background work. It is best effort, not full browser equivalence or a guarantee of target acceptance. A complete six-field family alone does not prove every browser signal was collected.

## Compose the body once

A form result contains `form_fields` (an ordered object of raw exact-case names and values in observed insertion order) and `form_body` (telemetry only, already URL-encoded once). It also contains `request_id`, `generation_ms`, `profile_used`, `material_ref` and `material_expires_at`. It has no `headers` field and returns no target cookies. The six suffixes are `a/b/c/d/f/z`; keep an empty `d` value. Forms remain unsplit and have no `a0`, even when `a` exceeds 7,900 characters. Each opaque value is at most 16 KiB UTF-8 without control characters; the encoded telemetry body is at most 256 KiB.

Synthetic response excerpt (values are illustrative, not usable telemetry):

```json
{
  "form_fields": {
    "site-fielda": "example+value",
    "site-fieldb": "example+value",
    "site-fieldc": "example+value",
    "site-fieldd": "",
    "site-fieldf": "example+value",
    "site-fieldz": "example+value"
  },
  "form_body": "site-fielda=example%2Bvalue&site-fieldb=example%2Bvalue&site-fieldc=example%2Bvalue&site-fieldd=&site-fieldf=example%2Bvalue&site-fieldz=example%2Bvalue",
  "request_id": "00000000-0000-4000-8000-000000000001",
  "generation_ms": 12,
  "profile_used": {
    "user_agent": "<effective browser user agent>",
    "platform": "<effective platform>"
  },
  "material_ref": "<returned material reference>",
  "material_expires_at": "2026-10-14T12:05:00Z"
}
```

Prepend `form_body`, followed by `&` and the application body only when that body is nonempty. These snippets use `result` from generation and the exact application body you supplied:

```python
# result: FormShapeResult from Client.generate(shape) in SDK 2.0.0 after explicit preparation.
wire_body = (
    result.form_body + ("&" + application_body if application_body else "")
).encode("utf-8")
# Send wire_body as data through your existing target_session.
```

```javascript
// result: FormShapeResult from await client.generate(shape) in SDK 2.0.0 after explicit preparation.
const wireBody = result.form_body + (applicationBody ? "&" + applicationBody : "");
// Send wireBody as the raw body through your existing target session.
```

Form mode was introduced in SDK 1.1.0. SDK 2.0.0 adds explicit preparation in a coordinated backend release preview; confirm availability before using the new startup flow. Typed `FormShapeResult` and optional header `a0` support remain unchanged. See the [Python](./guide/python.md) and [JavaScript](./guide/javascript.md) guides.

Do not URL-encode `form_body` again or pass the combined body to a form serializer. A serializer may turn `%` into `%25`, collapse duplicate keys or change application encoding. If you need to rebuild a form, iterate `form_fields` with `.items()` or `Object.entries` in returned order, append the application's ordered pairs, and serialize that entire list **once**, without also adding `form_body`. Never merge pairs into a dictionary/object.

## Use direct REST

The form generation request/response remains on `POST https://api.rayonapi.com/v1/shape`. The following coordinated preparation preview explicitly prepares and waits for complete readiness, calls generation, then sends raw bytes through the open `target_session` from [material collection](./guide/material.md). Run the collection and this step in the same process so scripts, cookies, browser identity and sticky proxy/IP remain consistent.

Save current source-page `document.cookie` in `document-cookie.txt` without a trailing newline. Save observed required target headers as `application-headers.json`; keep authentication/CSRF when required, and exclude the RayonAPI key. Replace the generic endpoint, origin allowlist and form selectors with the approved values you observed. Include clicked-submit data in `request-body.txt` and remove only stale telemetry before this call.

```python
"""Preparation preview: continue after collection in the same process/session."""
import json
import os
import random
import re
import time
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

class APIHTTPError(RuntimeError):
    def __init__(self, status):
        super().__init__(f"Rayon API HTTP {status}")
        self.status = status

api_opener = build_opener(NoRedirect)
api_key = os.environ["RAYON_API_KEY"]

def api_call(method, path, payload=None, *, idempotency_key=None, timeout=45):
    headers = {"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}
    if idempotency_key is not None:
        headers["Idempotency-Key"] = idempotency_key
    request = Request("https://api.rayonapi.com" + path,
        data=None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers, method=method)
    try:
        with api_opener.open(request, timeout=timeout) as response:
            status = response.status
            if status != 200 and not (path == "/v1/materials/prepare" and status == 202):
                raise APIHTTPError(status)
            raw = response.read(256 * 1024 + 1)
            if len(raw) > 256 * 1024:
                raise RuntimeError("Invalid API response size")
    except HTTPError as error:
        raise APIHTTPError(error.code) from None
    except (URLError, TimeoutError):
        raise RuntimeError("Rayon API transport failed") from None
    def pairs(items):
        result = {}
        for name, value in items:
            if name in result:
                raise ValueError()
            result[name] = value
        return result
    def constant(_):
        raise ValueError()
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=constant)
    except (ValueError, UnicodeError):
        raise RuntimeError("Invalid API JSON response") from None

def prepare_and_wait(shape):
    # Exactly one POST. Reuse this key if implementing a deliberate POST retry.
    job = api_call("POST", "/v1/materials/prepare", shape, idempotency_key=uuid.uuid4().hex)
    ident = job.get("preparation_id") if isinstance(job, dict) else None
    if not isinstance(ident, str) or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", ident) or api_key in ident:
        raise RuntimeError("Invalid preparation ID")
    deadline = time.monotonic() + 60
    while True:
        if job.get("preparation_id") != ident or job.get("status_url") != "/v1/materials/preparations/" + ident:
            raise RuntimeError("Invalid preparation response")
        state = job.get("state")
        if state == "ready":
            ref = job.get("material_ref")
            if (job.get("execution_backend") != "rust" or not job.get("ready_until")
                    or not isinstance(ref, str) or not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", ref) or api_key in ref):
                raise RuntimeError("Invalid readiness metadata")
            return job
        if state in ("failed", "expired"):
            raise RuntimeError("Preparation " + state + "; preparation ID: " + ident)
        if state not in ("queued", "learning", "validating", "publishing"):
            raise RuntimeError("Invalid preparation state")
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError("Preparation wait timed out; resume preparation ID: " + ident)
        try:
            job = api_call("GET", "/v1/materials/preparations/" + ident + "?wait=" + str(min(10, int(remaining))),
                timeout=remaining)
        except APIHTTPError as error:
            if error.status not in (408, 429, 500, 502, 503, 504):
                raise
            time.sleep(min(random.uniform(.05, .15), max(0, deadline - time.monotonic())))
            continue
        time.sleep(min(.01, max(0, deadline - time.monotonic())))

from pathlib import Path
from urllib.parse import urlsplit

# target_session, source_url, scripts and profile come from material collection.
request_url = "https://shop.example.com/account"  # Your exact observed action URL.
application_body = Path("request-body.txt").read_bytes().decode("utf-8")
document_cookie = Path("document-cookie.txt").read_bytes().decode("utf-8")
# Observed target headers, including current auth/CSRF when required; no Rayon key.
application_headers = json.loads(Path("application-headers.json").read_text("utf-8"))
observed_form = {"id": "account-form", "name": "account"}  # Omit absent attributes.
allowed_origins = {("https", "shop.example.com", 443)}
parsed = urlsplit(request_url)
port = parsed.port if parsed.port is not None else 443
if (not 1 <= port <= 65535 or parsed.username is not None or parsed.password is not None or parsed.fragment
        or (parsed.scheme, parsed.hostname, port) not in allowed_origins):
    raise ValueError("Use the exact approved HTTPS endpoint origin")
shape = {
    "source_url": source_url,
    "scripts": scripts,  # Full JavaScript sources, in observed execution order.
    "profile": profile,
    "document_cookie": document_cookie,  # JS-visible source-page cookies only.
    "mode": "form",
    "form": observed_form,
    "request": {
        "url": request_url,
        "method": "POST",
        "content_type": "application/x-www-form-urlencoded",
        "body": application_body,  # Application fields before fresh telemetry.
    },
}
ready = prepare_and_wait(shape)
generation_shape = {name: value for name, value in shape.items() if name != "scripts"}
generation_shape["material_ref"] = ready["material_ref"]
result = api_call("POST", "/v1/shape", generation_shape)
wire_body = (
    result["form_body"] + ("&" + application_body if application_body else "")
).encode("utf-8")
# The client owns cookie/connection headers; recompute headers tied to these bytes.
application_headers = {
    key: value for key, value in application_headers.items()
    if key.lower() not in {"host", "cookie", "content-length", "transfer-encoding",
                           "content-type", "user-agent"}
}
headers = {
    **application_headers,
    "Content-Type": shape["request"]["content_type"],
    "User-Agent": result["profile_used"]["user_agent"],
}
# A raw request keeps a page's Shape submit handler from overwriting these fields.
response = target_session.request(
    "POST", request_url, data=wire_body, headers=headers,
    allow_redirects=False, timeout=30,
)
print("Rayon request ID:", result["request_id"])
print("Target status:", response.status_code)
# Inspect response body, redirect and expected application outcome. 200 may challenge.
```

This raw target request sends the generated telemetry once. If you send through a browser instead, its Shape submit handler can replace or append fields after you apply the API result. Inspect the final outgoing raw body after those handlers; confirm the API names/values survived unchanged and telemetry was not inserted twice.

## Send with the same state

Send the composed bytes to the exact approved endpoint using POST and `Content-Type: application/x-www-form-urlencoded`. Keep the target's required application headers, scoped cookie jar, CSRF token, authentication, measured browser identity and sticky proxy/IP/transport from material collection. Keep the RayonAPI key in the API call only.

Generate fresh telemetry for each application request. A material reference reuses script source, not tokens or form state; supply current profile, cookies, application body and form identity each time. After `material_expired`, upload your retained scripts again.

Check the target response body as well as its HTTP status. Generation success does not establish target acceptance. Compare the final raw body and Form Data with the observed request when diagnosing a challenge. See [troubleshooting](./guide/troubleshooting.md).


## Explicit form readiness

Prepare the full form ShapeRequest before workload startup, including the exact
original application body, current profile/source-document cookies, and form
identity. Partial material or partial form output fails preparation. `ready`
confirms complete requested output validation/publication and the `rust` backend;
it is metadata, not a set of old form fields to replay. Reprepare after readiness
expiry or relevant context changes. The [planned 30-day migration](./reference/preparation.md)
is gated on the announced backend rollout; mandatory enforcement is not active in
this preview. `generate` never prepares or waits implicitly.
