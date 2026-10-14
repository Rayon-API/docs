# Core requirements

| Requirement | What to keep consistent |
| --- | --- |
| Target session | One scoped cookie jar and sticky proxy across page, script and application requests. |
| Browser identity | Measured profile, User-Agent, client hints and target transport must agree. |
| Target transport | Use a browser-grade TLS client such as `curl_cffi`; configure impersonation, proxy and browser headers explicitly. |
| Request context | Exact URL, method, content type and UTF-8 body sent to the target. |
| Application access | Keep the target's authentication, CSRF, Origin, Referer and other required headers. |
| RayonAPI access | Approved source/endpoint domains and a server-side API key. Never send that key to the target. |

Ordinary HTTPS is sufficient for SDK calls to RayonAPI. The SDK does not configure your target transport.

Use the supported [material](./material.md) and [profile](./profiles.md) fields. Unknown fields are rejected; native Android/iOS protection protocols are outside the web Shape contract.

Start with the [collection walkthrough](./preparation-walkthrough.md).
