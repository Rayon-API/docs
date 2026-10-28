"""Managed generation example; use the SDK for complete contract validation."""
import json
import os
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

from pathlib import Path
shape = json.loads(Path("shape.json").read_text(encoding="utf-8"))
result = api_call("POST", "/v1/shape", shape)
if result.get("fallback_reason"):
    print("A fallback was used. Contact support with request ID:", result["request_id"])
print("Generated request:", result["request_id"])
# Apply result["headers"] using your existing target session and exact request.
