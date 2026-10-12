# Migrate from 0.1

Version 1 replaces the URL-only `/solve` flow with client-supplied material at `/v1/shape`. Old `/solve` requests return HTTP 410 `api_retired`; there is no automatic download fallback.

1. Upgrade the SDK to version 1.
2. Download protection scripts using your own target session and retain its cookies.
3. Supply ordered scripts, supported profile and exact request context to `generate()`.
4. Apply `result.headers` with your original cookie jar and target client.

The old `solve(target_url, api_key)` function and status/cookies/internal-method response fields are removed. A successful generation uses HTTP 200; unsuccessful generation uses structured non-2xx errors.

Use `material_ref` for subsequent requests that reuse the same script bundle, and supply current request/profile/cookie inputs each time. Keep original material for cache expiry.

Historical 0.1 packages remain available but are incompatible with the retired URL-mode API. See [quickstart](./quickstart.md) and the [reference](../reference/shape.md).
