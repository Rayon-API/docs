# Troubleshooting

## The API returns an HTTP error

Check the [HTTP status reference](../reference/errors.md). Confirm that the API key is valid, the account can make requests, current policies are accepted, and the target domain is approved. Keep the key in the `Authorization: Bearer` header.

For `429`, honor `Retry-After`; avoid immediate concurrent retries. For `422`, check `target_url` and the optional JSON-compatible profile.

## HTTP 200, but capture failed

Inspect `status`. An HTTP `200` response can contain `failed`, so transport success alone is insufficient. Review the returned diagnostics without logging API keys or session data. Check that you used the real source page on an approved domain.

## Accepted, with nonempty errors

An accepted fallback can retain diagnostics from an earlier attempt. Do not reclassify an accepted capture as failed solely because `errors` is nonempty. Acceptance still does not prove downstream enforcement success.

## The target rejects the request

Check the application request first:

- Does the actual endpoint expect this method, content type, and body?
- Are its own API key and CSRF headers present and current? The RayonAPI key is only for RayonAPI.
- Are cookies scoped correctly and from the same session?
- Are the user agent, profile, TLS behavior, and egress IP consistent?
- Was telemetry captured from the actual source page for this workflow?

Keep returned telemetry and cookies bound to the exact intended HTTPS origin and disable redirects. Preserve cookie domain/path restrictions and returned header names, values, and supported order. See [core requirements](./requirements.md).

The public solve request has no downstream endpoint, method, body, or proxy controls. Changing your local route or proxy does not cause the API to align the capture with it.

## Solve duration differs from elapsed time

`duration_ms` measures execution on the server. Your elapsed time also includes network and connection overhead. A client timeout can expire before a solve response reaches you; it is not the server's duration limit.

## Share a diagnostic safely

Include the HTTP status, capture status, timing, and `X-Request-ID` when available. Redact API keys, telemetry values, cookies, request bodies, and any sensitive URL query parameters before sharing logs.
