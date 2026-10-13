# Apply generated headers

Use the target session that downloaded the protection material. It already owns the cookies and proxy configuration for that workflow.

```python
from urllib.parse import urlsplit

def https_origin(url):
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or not parsed.hostname
            or parsed.username is not None or parsed.password is not None
            or parsed.fragment):
        raise ValueError("Use an HTTPS URL without credentials or fragments")
    port = parsed.port if parsed.port is not None else 443
    if not 1 <= port <= 65535:
        raise ValueError("Use a valid HTTPS port")
    return (parsed.hostname.lower(), port)

# Configure these explicitly for your approved integration, including API subdomains.
allowed_origins = {
    https_origin("https://shop.example.com"),
    https_origin("https://api.shop.example.com"),
}
request = shape["request"]
if https_origin(request["url"]) not in allowed_origins:
    raise ValueError("Endpoint origin is not allowed by this integration")
body = request["body"]
headers = {
    **application_headers,
    **result.headers,
    "User-Agent": profile["user_agent"],
}
if request["content_type"] is not None:
    headers["Content-Type"] = request["content_type"]
response = target_session.request(
    request["method"],
    request["url"],
    data=body.encode("utf-8") if body is not None else None,
    headers=headers,
    allow_redirects=False,
    timeout=30,
)
```

Source and endpoint domains can differ when both have approved access. Use an explicit HTTPS origin allowlist, not a wildcard suffix check. Keep cookies in the scoped cookie jar; a cookie for the source host must not be manually forwarded to a different API host. Disable redirects so credentials cannot follow a request to an unapproved destination.

`application_headers` includes the target's required Origin, Referer, CSRF or application authentication fields. Keep these separate from the RayonAPI key. Never forward `Authorization: Bearer <RayonAPI key>` to the target.

Do not reserialize JSON after generation: the exact body string, URL and method used for generation must match the outgoing request. Apply the returned names unchanged; different customers use different header prefixes. Remove stale telemetry from a previous request before adding the fresh generated family.

The target HTTP client needs browser-grade TLS and consistent browser header behavior. The API SDK's connection to RayonAPI does not configure this client. Cookies retain their domain/path/security scope; avoid manually copying an entire cookie jar into a Cookie header.

Inspect the target's status and body. A 200 challenge page is still a blocked workflow. A 400 application error may mean invalid test data, but it does not by itself prove header acceptance. Generation and target acceptance are separate outcomes.
