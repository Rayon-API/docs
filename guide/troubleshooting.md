# Troubleshooting

## Generation rejected

Check the structured error code and `request_id`. `invalid_input` identifies an unsupported input shape; `unsupported_material` means the supplied script bundle could not generate the required family. Confirm loader dependencies, script order, full source and exact URLs.

`material_expired` means the reference was evicted, expired or is unavailable to your key. Upload your retained script bundle again with current request and session inputs.

## Capacity or rate limit

For HTTP 429, inspect `error.code` and `Retry-After`. Available execution slots and account quotas are separate limits. The SDK does not automatically retry billable generation calls.

## Timeout

The default SDK timeout is 30 seconds for the whole API exchange. Server execution has a shorter bounded deadline. Upload time and network latency contribute to client-visible time. A timeout or cancellation can still consume an admitted attempt.

## Generated headers but target rejected

Check the exact method, URL, content type and body; supported browser identity; target TLS/header behavior; cookie scope; proxy session; required application headers and credentials. Do not reuse stale telemetry.

Inspect response content as well as status. A success status can contain a human-verification page. A business-validation error is different from a protection block, but status alone is insufficient to establish acceptance.

When contacting support, provide the RayonAPI request ID and sanitized error code. Keep API keys, raw material, target cookies and private application bodies out of public reports.
