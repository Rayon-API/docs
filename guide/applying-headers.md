# Apply generated headers

## 1. Keep the collecting session open

Use the target session that downloaded material, with its scoped cookie jar, sticky proxy and matching browser transport. Prepare `application_headers` with the target's required authentication, CSRF, Origin and Referer fields; exclude stale telemetry.

## 2. Send the exact request

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

Configure explicit allowed origins for your approved source and endpoint hosts, including API subdomains. Keep cookies in the jar so domain/path/security scope is preserved. Disable redirects and inspect them before forwarding credentials.

Send the body as the same UTF-8 bytes used for generation. Do not reserialize JSON or rename returned headers. Never forward the RayonAPI Bearer key to the target.

## 3. Inspect target content

Check status and body for challenges, authentication and application errors. A 200 challenge is blocked; a 400 business error alone does not prove telemetry acceptance. Use [troubleshooting](./troubleshooting.md) if generation succeeds but the target rejects the request.
