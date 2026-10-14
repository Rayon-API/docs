# POST /v1/shape

Generate one fresh Shape telemetry family from client-supplied JavaScript. Header mode is the default; [form mode](../form-payload-integration.md) returns body fields.

| Setting | Value |
| --- | --- |
| Base URL | `https://api.rayonapi.com` |
| Authentication | `Authorization: Bearer <api_key>` |
| Content type | `application/json` |

[Download the OpenAPI schema](/schema/shape-v1.openapi.json).

## Request fields

| Field | Required value |
| --- | --- |
| `mode` | Optional `header` (default) or `form`. |
| `form` | Optional form-mode-only object with `id`/`name` strings, at most 256 characters each; no controls. |
| `source_url` | Page where the protection executes. Context only; never fetched. |
| `scripts` | Ordered nonempty `{url, source}` list. Supply this or `material_ref`, never both. |
| `material_ref` | Earlier reference, scoped to the creating key and original source context. |
| `profile` | [Supported browser profile](../guide/profiles.md). |
| `request.url` | Exact protected endpoint URL, including query parameters. |
| `request.method` | `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`. |
| `request.content_type` | Required key; supported text MIME type when body is non-null, otherwise null is allowed. |
| `request.body` | Required key; exact UTF-8 string or null. Empty string differs from null. GET/HEAD require null. |
| `document_cookie` | Optional current JavaScript-visible source-document cookies; default empty string. |

Approve source and endpoint domains for your account. URLs cannot contain credentials, fragments, whitespace or backslashes. Unknown fields, duplicate/prototype JSON keys, nonfinite values and binary bodies are rejected. No proxy/IP field is accepted.

In form mode, the target request must be POST with `application/x-www-form-urlencoded`; `request.body` is the exact encoded application body before telemetry insertion (empty string allowed, null forbidden). One UTF-8 charset parameter is allowed. Malformed percent escapes, invalid UTF-8 and NUL are rejected. Preserve ordered duplicates and empty values; remove only stale telemetry.

## Response fields

HTTP 200 returns:

| Field | Meaning |
| --- | --- |
| `headers` | Header mode only. Six required common-prefix suffixes `a/b/c/d/f/z` plus optional same-family `a0` freshly emitted by the uploaded scripts; `d` may be empty. Forward the entire map unchanged. |
| `request_id` | Correlation ID, also in `X-Request-ID`. |
| `generation_ms` | Server generation time; excludes upload/network overhead. |
| `profile_used` | Sanitized effective profile, without canvas pixels or cookies. |
| `material_ref` | Reuse the uploaded source bundle. |
| `material_expires_at` | UTC expiry; eviction/restart may invalidate it earlier. |

Form mode returns exactly six unsplit `form_fields` with suffixes `a/b/c/d/f/z` (raw names/values in observed order; no `a0`, even when `a` exceeds 7,900 characters) and `form_body` (telemetry only, encoded once), with the same metadata above and without `headers`. Preserve exact case, names and empty values; do not infer a separator from header names. [Compose it with the application body once](../form-payload-integration.md#compose-the-body-once).

No target cookies are returned. [Apply names and values unchanged](../guide/applying-headers.md). Generation success does not guarantee target acceptance.

## Input limits

| Input | Maximum |
| --- | --- |
| JSON upload, compressed and decoded | 4 MiB each |
| JSON structure | 4,096 nodes including member names; nesting depth 32 |
| Script source total / individual | 3 MiB / 2 MiB UTF-8 |
| Scripts | 16 |
| Request body | 256 KiB UTF-8 |
| Form application input | 1,024 decoded pairs; 256 UTF-8 bytes per field name |
| Form output | 16 KiB UTF-8 per value; 256 KiB encoded telemetry body |
| Effective profile | 64 KiB; canvas must also pass PNG validation |
| JavaScript-visible cookie text | 16 KiB; no CR, LF or NUL |
| Each URL | 8,192 characters |
| Header output / API response | 256 KiB |

Uploads have a 20-second deadline. Concurrent uploads/generation are bounded; excess capacity returns 429 without queueing. See [errors](./errors.md) and [usage](./usage.md).
