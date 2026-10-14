# Migrate to version 1

Version 1 replaces the retired URL-only interface with client-supplied material. Old requests return HTTP 410 `api_retired`; there is no automatic-download fallback.

1. Upgrade the Python or JavaScript SDK to version 1.
2. [Collect protection source](./preparation-walkthrough.md) in your target session and retain its cookies.
3. Replace the old URL-based helper with `generate(shape)` using ordered scripts, a supported profile and exact request context.
4. Apply `result.headers` using that same target session.

The old status, cookies and internal-method response fields are removed. Use `request_id`, `generation_ms` and `profile_used`; HTTP 200 indicates generation success and non-2xx responses carry [structured errors](../reference/errors.md).

Material references reuse source only. Keep source for expiry and provide current request/profile/cookie inputs each time. Historical 0.1 packages remain available but do not work with the current API.

Continue with the [quickstart](./quickstart.md).
