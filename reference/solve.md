# POST /solve

```text
POST https://api.rayonapi.com/solve
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

Keep the API key in the authorization header, never in a URL or log. Target domains require approval in the [dashboard](https://dashboard.rayonapi.com).

## Request

```json
{
  "target_url": "https://example.com/start"
}
```

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `target_url` | string | Yes | Actual source-page URL for the target workflow. Must be a valid public HTTP(S) URL without embedded credentials, on an approved domain. |
| `profile` | object | No | JSON-compatible fingerprint fields. Omit for the service default. |

The public contract exposes no downstream endpoint URL, method, body, or proxy controls. Do not add request-binding parameters. `/verify` is not a public endpoint.

## Response

An illustrative accepted response uses a fictional header prefix and redacted values:

```json
{
  "status": "accepted",
  "method": "v8_sandbox",
  "target_url": "https://example.com/start",
  "duration_ms": 1200,
  "headers": {
    "X-Example-a": "redacted",
    "X-Example-b": "redacted",
    "X-Example-c": "redacted",
    "X-Example-d": "",
    "X-Example-f": "redacted",
    "X-Example-z": "redacted"
  },
  "cookies": [
    {
      "name": "example_session",
      "value": "redacted",
      "domain": "example.com",
      "path": "/"
    }
  ],
  "profile_used": {},
  "errors": []
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `status` | `accepted` / `failed` / `rejected` | Capture outcome. Check this even for HTTP `200`. |
| `method` | `v8_sandbox` / `playwright` | Method that produced the result. |
| `target_url` | string | Target source-page URL. |
| `duration_ms` | integer | Server solve execution time in milliseconds. |
| `headers` | string mapping | Six telemetry headers on successful capture; names use a variable customer prefix and suffixes `a/b/c/d/f/z`. An empty `d` value is allowed. |
| `cookies` | array | Collected cookies, each containing `name`, `value`, `domain`, and `path`. |
| `profile_used` | object | Fingerprint values used for this request. |
| `errors` | string array | Diagnostics. May include earlier attempt failures after a successful fallback. |

`accepted` means six headers were captured, not that a later protected endpoint accepted them. A successful fallback can retain older diagnostics in `errors`.

`duration_ms` excludes client-side connection setup, network latency, and response processing. Measure elapsed client time separately.

## Replay boundaries

Cookie responses omit secure, host-only, expiry, and other browser attributes. Respect returned domain/path scope, restrict replay to the exact intended HTTPS origin, and disable redirects. Do not flatten all cookies into a single `Cookie` header. See [core requirements](../guide/requirements.md#cookie-scope).

Returned header order does not guarantee an HTTP/2 fingerprint. The target client is responsible for browser-grade TLS and coherent session behavior.

See [errors and limits](./errors.md) for HTTP failures and retry behavior.
