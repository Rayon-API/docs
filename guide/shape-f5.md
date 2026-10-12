# Shape / F5

Shape protects selected application requests with customer-specific telemetry headers. The prefix varies by site; use the names returned by RayonAPI without renaming them.

The material-only flow is:

1. Download the required protection scripts using your target session.
2. Supply their ordered source, supported profile and exact application request to `/v1/shape`.
3. Add the returned six-header family to that request and send it using the same target session.

The six suffixes are `a`, `b`, `c`, `d`, `f` and `z`. The `d` value may be empty. A complete generated family does not establish that the site accepted the request.

Loader-dependent payloads need their loader and exact script URLs. Scripts that require unsupported network dependencies cannot be repaired by the API downloading extra resources.

Do not reuse telemetry from a different request, session or browser profile. Material references reuse script source only; every API call generates fresh headers for the current request.

Start with [material preparation](./material.md), then [apply the headers](./applying-headers.md). Diagnose application errors separately from [generation errors](../reference/errors.md).
