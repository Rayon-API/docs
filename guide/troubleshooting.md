# Troubleshooting

| Symptom | Next step |
| --- | --- |
| `invalid_input` | Check required fields, exact types, profile aliases and [input limits](../reference/shape.md#input-limits). |
| `unsupported_material` / incomplete family | Confirm full protection source, exact URLs, loader dependencies and execution order. Check for HTML challenge responses. |
| `material_expired` | Upload retained source with current context; use a fresh SDK client to bypass a stale cached reference. References may disappear before expiry. |
| HTTP 401 | Check that the API key is valid and active. |
| HTTP 403 | Read `reason` and `action`: check expired access, contact support for a disabled account, accept policies or request domain approval. Check `domain` and `field` for the rejected host. |
| HTTP 402 `insufficient_credits` | Top up the wallet or wait for allowance renewal; check [usage](../reference/usage.md). |
| HTTP 429 | `rate_limited`: slow requests; `concurrency_exceeded`: reduce in-flight requests; `capacity_exceeded`: wait. Respect `Retry-After`. |
| HTTP 503 `credits_warming` | Credits are being prepared. Wait one second (`Retry-After: 1`) before retrying. |
| Upload timeout | Keep within the 20-second upload deadline and size limits. |
| Client timeout / cancellation, billing `pending` / `unknown` | Check request history before retrying; generation may already have settled. Contact support with the request ID if the outcome remains unclear. |
| Headers generated, target blocked | Compare exact body bytes, URL/method/content type, TLS/browser identity, proxy, scoped cookies and required application headers. |
| Target returned 200 or an application error | Inspect content: a 200 can be a challenge, and a business error alone does not prove header acceptance. |

Domain approval covers an apex domain and its `www` alias. Other subdomains need explicit approval. `domain_pending` means an approval request is known to be pending.

The SDK's default total timeout is 45 seconds in version 1.0.1+. It includes upload and network time. Generation POSTs are never retried automatically; each explicit retry is a new attempt.

For support, share `request_id`, sanitized error code and redacted diagnostics. Keep keys, raw scripts, generated headers, cookies and private request bodies out of public reports. See [API errors](../reference/errors.md).
