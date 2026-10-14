# Form payload integration

Use form mode when the observed protected request carries Shape telemetry in its URL-encoded body. Header mode remains the default. Both use public `POST /v1/shape`; the retired public `/solve` still returns HTTP 410. Private tooling is not a public integration endpoint.

## Inspect the request first

In browser DevTools, preserve the Network log and inspect **Payload → Form Data** as well as request headers. Record the endpoint, POST method, `application/x-www-form-urlencoded` content type, exact encoded application body, form ID/name when relevant, and current cookies/CSRF state. Use the raw source view to preserve encoding and order.

Form field names can differ from header names. Their separator and exact case also vary: the illustrative family `site-fielda/b/c/d/f/z` has no separator before its suffix. Never derive names by rewriting a header prefix. Download the [complete ordered material](./guide/material.md) and use a [measured profile](./guide/profiles.md) from the same session.

## Generate form telemetry

Prepare `shape.json` with your actual downloaded scripts (or a valid `material_ref`), measured profile and current JavaScript-visible `document_cookie`. The following excerpt shows the additional fields; it is not a complete request:

```json
{
  "mode": "form",
  "form": { "id": "account-form", "name": "account" },
  "request": {
    "url": "https://shop.example.com/account",
    "method": "POST",
    "content_type": "application/x-www-form-urlencoded",
    "body": "item=first&item=second&empty=&csrf=a%2Bb&name=caf%C3%A9"
  }
}
```

`request.body` is your application's exact encoded body **before telemetry insertion**. An empty string is valid; null is not. A single UTF-8 charset parameter is allowed in the content type. Preserve duplicate fields, empty values and field order. Replace only stale telemetry tokens from an earlier generation, using their observed exact names; retain application fields, CSRF and cookies. Do not submit a stale complete telemetry family as application input.

`form` is optional; its `id` and `name` identify the observed form when the material needs a selector. Each is a string of at most 256 characters without control characters. Do not send `form` in header mode.

```sh
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/shape \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @shape.json
```

The API envelope stays JSON; `request.content_type` describes the later target request. Form input is limited to 256 KiB UTF-8, 1,024 decoded pairs and 256 UTF-8 bytes per field name. Malformed percent escapes, invalid UTF-8 and NUL are rejected. See [request fields and limits](./reference/shape.md).

## Compose the body once

A form result contains `form_fields` (an ordered object of raw exact-case names and values in observed insertion order) and `form_body` (telemetry only, already URL-encoded once). It also contains `request_id`, `generation_ms`, `profile_used`, `material_ref` and `material_expires_at`. It has no `headers` field and returns no target cookies. The six suffixes are `a/b/c/d/f/z`; keep an empty `d` value. Each opaque value is at most 16 KiB UTF-8 without control characters; the encoded telemetry body is at most 256 KiB.

Synthetic response excerpt (values are illustrative, not usable telemetry):

```json
{
  "form_fields": {
    "site-fielda": "example+value",
    "site-fieldb": "example+value",
    "site-fieldc": "example+value",
    "site-fieldd": "",
    "site-fieldf": "example+value",
    "site-fieldz": "example+value"
  },
  "form_body": "site-fielda=example%2Bvalue&site-fieldb=example%2Bvalue&site-fieldc=example%2Bvalue&site-fieldd=&site-fieldf=example%2Bvalue&site-fieldz=example%2Bvalue",
  "request_id": "00000000-0000-4000-8000-000000000001",
  "generation_ms": 12,
  "profile_used": {
    "user_agent": "<effective browser user agent>",
    "platform": "<effective platform>"
  },
  "material_ref": "<returned material reference>",
  "material_expires_at": "2026-10-14T12:05:00Z"
}
```

Prepend `form_body`, followed by `&` and the application body only when that body is nonempty. These snippets use `result` from generation and the exact application body you supplied:

```python
# result: FormShapeResult from Client.generate(shape) in SDK 1.1.0.
wire_body = (
    result.form_body + ("&" + application_body if application_body else "")
).encode("utf-8")
# Send wire_body as data through your existing target_session.
```

```javascript
// result: FormShapeResult from await client.generate(shape) in SDK 1.1.0.
const wireBody = result.form_body + (applicationBody ? "&" + applicationBody : "");
// Send wireBody as the raw body through your existing target session.
```

SDK 1.1.0 adds typed `FormShapeResult` support; use that version when published. REST works with the same JSON contract. Existing SDK/header integrations keep their current behavior. See the [Python](./guide/python.md) and [JavaScript](./guide/javascript.md) guides.

Do not URL-encode `form_body` again or pass the combined body to a form serializer. A serializer may turn `%` into `%25`, collapse duplicate keys or change application encoding. If you need to rebuild a form, iterate `form_fields` with `.items()` or `Object.entries` in returned order, append the application's ordered pairs, and serialize that entire list **once**, without also adding `form_body`. Never merge pairs into a dictionary/object.

## Send with the same state

Send the composed bytes to the exact approved endpoint using POST and `Content-Type: application/x-www-form-urlencoded`. Keep the target's required application headers, scoped cookie jar, CSRF token, authentication, measured browser identity and sticky proxy/IP/transport from material collection. Keep the RayonAPI key in the API call only.

Generate fresh telemetry for each application request. A material reference reuses script source, not tokens or form state; supply current profile, cookies, application body and form identity each time. After `material_expired`, upload your retained scripts again.

Check the target response body as well as its HTTP status. Generation success does not establish target acceptance. Compare the final raw body and Form Data with the observed request when diagnosing a challenge. See [troubleshooting](./guide/troubleshooting.md).
