# POST /v1/shape

Generate one fresh Shape header family from client-supplied protection material.

**Base URL:** `https://api.rayonapi.com`  
**Authentication:** `Authorization: Bearer <api_key>`  
**Content type:** `application/json`

## Request

| Field | Requirement |
| --- | --- |
| `source_url` | Actual source page URL; contextual only, never fetched. |
| `scripts` | Ordered nonempty `{url, source}` list, mutually exclusive with `material_ref`. |
| `material_ref` | Reference from an earlier result, scoped to this key and original source context. |
| `profile` | Supported browser profile. See [profiles](../guide/profiles.md). |
| `request.url` | Exact protected endpoint URL, preserving its query. |
| `request.method` | GET, HEAD, POST, PUT, PATCH, DELETE or OPTIONS. |
| `request.content_type` | Required key. Use a content type when body is non-null; otherwise use null. |
| `request.body` | Exact UTF-8 string or null. GET/HEAD require null. Binary bodies unsupported. |
| `document_cookie` | Optional source-page JavaScript-visible cookies. Never a full cookie jar. |

Source and request domains must be approved for your account. Unknown fields are rejected. URLs cannot contain credentials or fragments. No proxy or unused IP parameter is accepted.

## Successful response

HTTP 200 contains:

| Field | Meaning |
| --- | --- |
| `headers` | One complete customer-specific family with suffixes a/b/c/d/f/z; d may be empty. |
| `request_id` | Correlation ID, also returned as `X-Request-ID`. |
| `generation_ms` | Server generation time; excludes some API/network/upload overhead. |
| `profile_used` | Sanitized effective profile summary. |
| `material_ref` | Reuse this bundle without uploading script source again. |
| `material_expires_at` | UTC expiry timestamp; eviction/restart can invalidate it sooner. |

No target cookies are returned. Generation success is distinct from target acceptance. Preserve generated header names and values unchanged.

## Input limits

| Input | Maximum |
| --- | --- |
| Decoded JSON request | 4 MiB |
| Script source total / individual | 3 MiB / 2 MiB |
| Scripts | 16 |
| Request body | 256 KiB UTF-8 |
| Profile JSON | 64 KiB, with additional canvas validation |
| JavaScript-visible cookie text | 16 KiB |
| Each URL | 8,192 characters |
| Response | 256 KiB |

Both compressed and decoded limits apply to gzip requests. See [errors](./errors.md) for failure codes and [usage](./usage.md) for accounting.
