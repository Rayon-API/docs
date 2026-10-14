"""Continue after the material-collection snippet, in the same process/session."""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

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
api_request = Request(
    "https://api.rayonapi.com/v1/shape",
    data=json.dumps(shape, ensure_ascii=False).encode("utf-8"),
    headers={"Authorization": "Bearer " + os.environ["RAYON_API_KEY"],
             "Content-Type": "application/json"},
    method="POST",
)
# This is a separate REST API client, not the target's cookie/proxy session.
with urlopen(api_request, timeout=45) as api_response:
    result = json.load(api_response)
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
