# Troubleshooting

| Symptom | Next step |
| --- | --- |
| `invalid_input` | Check required fields, exact types, profile aliases and [input limits](../reference/shape.md#input-limits). |
| `unsupported_material` / incomplete family | Confirm full protection source, exact URLs, loader dependencies and execution order. Check for HTML challenge responses. |
| `material_expired` | Upload retained source with current profile, request and cookies. References can disappear before their five-minute expiry. |
| HTTP 401 / 403 | Check key, account/policy status and approval for both source and endpoint domains. |
| HTTP 402 | Check [weekly allowance and wallet funds](../reference/usage.md). |
| HTTP 429 | Inspect error code and `Retry-After`; account rate and generation capacity are separate limits. |
| Upload timeout | Keep within the 20-second upload deadline and size limits. |
| Client timeout / cancellation | Check request history and usage before retrying; generation may already have succeeded and settled. |
| Headers generated, target blocked | Compare exact body bytes, URL/method/content type, TLS/browser identity, proxy, scoped cookies and required application headers. |
| Target returned 200 or an application error | Inspect content: a 200 can be a challenge, and a business error alone does not prove header acceptance. |

The SDK's default total timeout is 45 seconds in version 1.0.1+. It includes upload and network time. Generation POSTs are never retried automatically; each explicit retry is a new attempt.

For support, share `request_id`, sanitized error code and redacted diagnostics. Keep keys, raw scripts, generated headers, cookies and private request bodies out of public reports. See [API errors](../reference/errors.md).
