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
