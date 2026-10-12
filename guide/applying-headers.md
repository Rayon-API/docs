# Apply generated headers

Use the target session that downloaded the protection material. It already owns the cookies and proxy configuration for that workflow.

```python
headers = {
    **application_headers,
    **result.headers,
    "User-Agent": profile["user_agent"],
    "Content-Type": shape["request"]["content_type"],
}
response = target_session.request(
    shape["request"]["method"],
    shape["request"]["url"],
    data=shape["request"]["body"],
    headers=headers,
    allow_redirects=False,
    timeout=30,
)
```

`application_headers` includes the target's required Origin, Referer, CSRF or application authentication fields. Keep these separate from the RayonAPI key. Never forward `Authorization: Bearer <RayonAPI key>` to the target.

Do not reserialize JSON after generation: the exact body string, URL and method used for generation must match the outgoing request. Apply the returned names unchanged; different customers use different header prefixes. Remove stale telemetry from a previous request before adding the fresh generated family.

The target HTTP client needs browser-grade TLS and consistent browser header behavior. The API SDK's connection to RayonAPI does not configure this client. Cookies retain their domain/path/security scope; avoid manually copying an entire cookie jar into a Cookie header.

Inspect the target's status and body. A 200 challenge page is still a blocked workflow. A 400 application error may mean invalid test data, but it does not by itself prove header acceptance. Generation and target acceptance are separate outcomes.
