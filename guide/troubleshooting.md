# Troubleshooting

`material_cache_unavailable` means automatic material is warming or temporarily
unavailable. Respect `Retry-After` and contact support with the request ID if it
continues. You do not need to collect scripts to use the managed flow.


For managed header generation, leave material omitted. For custom sources,
complete preparation first. Keep keys, cookies, request bodies and source captures
out of public support messages.


| Symptom | Next step |
| --- | --- |
| `invalid_input` | Check required fields, exact types, profile aliases and [input limits](../reference/shape.md#input-limits). |
| `unsupported_material` / `generation_incomplete` | Check full script source, exact URLs, loader dependencies and execution order. If all inputs are complete, contact support with the request ID; this error alone does not establish client fault. |
| `generation_failed` / `generation_invalid_headers` / `generation_invalid_form` | Retain the request ID and contact support if complete inputs still fail. These codes distinguish failed generation from invalid generated output. |
| `material_expired` | Refresh custom sources through preparation, wait for ready and switch references. Generation never re-uploads or retries. |
| HTTP 401 | Check that the API key is valid and active. |
| HTTP 403 | Read `reason` and `action`: check expired access, contact support for a disabled account, accept policies or request domain approval. Check `domain` and `field` for the rejected host. |
| HTTP 402 `insufficient_credits` | Top up the wallet or wait for allowance renewal; check [usage](../reference/usage.md). |
| `material_cache_full` | Contact support with the request ID. Inspect entry, global-byte and account-byte diagnostics; do not upload sources to generation. |
| HTTP 429 | `rate_limited`: slow requests; `concurrency_exceeded`: reduce in-flight requests; `capacity_exceeded`: wait. Respect `Retry-After`. |
| HTTP 503 `credits_warming` | Credits are being prepared. Wait one second (`Retry-After: 1`) before retrying. |
| Upload timeout | Keep within the 20-second upload deadline and size limits. |
| Client timeout / cancellation, billing `pending` / `unknown` | Check request history before retrying; generation may already have completed. Contact support with the request ID if the outcome remains unclear. |
| Headers generated, target blocked | Compare exact body bytes, URL/method/content type, TLS/browser identity, proxy, scoped cookies and required application headers. If those match, contact support with a sanitized paired exchange. API success alone does not establish target acceptance or client fault. |
| Target returned 200 or an application error | Inspect content: a 200 can be a challenge, and a business error alone does not prove header acceptance. |

Domain approval covers a root domain and its `www` alias. Other subdomains need explicit approval. `domain_pending` means an approval request is known to be pending.

The SDK default total timeout is 45 seconds, including upload and network time.
Generation never waits for preparation or retries automatically.

For support, share `request_id`, sanitized error code and redacted diagnostics. Keep keys, raw scripts, generated headers, cookies and private request bodies out of public reports. See [API errors](../reference/errors.md).


## Custom preparation

Preparation needs explicit material and full current context. A failed job is
not a partial generation response. Only successfully validated material can
become ready. Keep the
preparation ID to resume after timeout or cancellation. Cancelling a wait does
not cancel the server job. Readiness expires separately from a source reference.
See [states and lifetimes](../reference/preparation.md).
