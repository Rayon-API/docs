# Troubleshooting

| Symptom | Next step |
| --- | --- |
| `invalid_input` | Check required fields, exact types, profile aliases and [input limits](../reference/shape.md#input-limits). |
| `unsupported_material` / `generation_incomplete` | Check full script source, exact URLs, loader dependencies and execution order. If all inputs are complete, contact support with the request ID; this error alone does not establish client fault. |
| `generation_failed` / `generation_invalid_headers` / `generation_invalid_form` | Retain the request ID and contact support if complete inputs still fail. These codes distinguish failed generation from invalid generated output. |
| `material_expired` | SDK 1.1.4+ recovers once from a confirmed unbilled miss when it retains the source. Otherwise, upload retained source with current context. References can disappear before expiry. |
| HTTP 401 | Check that the API key is valid and active. |
| HTTP 403 | Read `reason` and `action`: check expired access, contact support for a disabled account, accept policies or request domain approval. Check `domain` and `field` for the rejected host. |
| HTTP 402 `insufficient_credits` | Top up the wallet or wait for allowance renewal; check [usage](../reference/usage.md). |
| `material_cache_full` | Reuse an existing reference, reduce distinct source uploads or wait for cache space. Retain original scripts. |
| HTTP 429 | `rate_limited`: slow requests; `concurrency_exceeded`: reduce in-flight requests; `capacity_exceeded`: wait. Respect `Retry-After`. |
| HTTP 503 `credits_warming` | Credits are being prepared. Wait one second (`Retry-After: 1`) before retrying. |
| Upload timeout | Keep within the 20-second upload deadline and size limits. |
| Client timeout / cancellation, billing `pending` / `unknown` | Check request history before retrying; generation may already have completed. Contact support with the request ID if the outcome remains unclear. |
| Headers generated, target blocked | Compare exact body bytes, URL/method/content type, TLS/browser identity, proxy, scoped cookies and required application headers. If those match, contact support with a sanitized paired exchange. API success alone does not establish target acceptance or client fault. |
| Target returned 200 or an application error | Inspect content: a 200 can be a challenge, and a business error alone does not prove header acceptance. |

Domain approval covers a root domain and its `www` alias. Other subdomains need explicit approval. `domain_pending` means an approval request is known to be pending.

The SDK's default total timeout is 45 seconds in version 1.0.1+. It includes upload and network time. In SDK 1.1.4+, this budget also covers coalesced material waits and the single confirmed-unbilled material recovery attempt. Other generation failures are never automatically retried; each explicit retry is a new attempt.

For support, share `request_id`, sanitized error code and redacted diagnostics. Keep keys, raw scripts, generated headers, cookies and private request bodies out of public reports. See [API errors](../reference/errors.md).


## Preparation startup (coordinated preview)

Do not start the workload while a preparation is queued, learning, validating or
publishing. Resume status/wait by the safe preparation ID after a timeout or
interrupted wait; cancellation leaves the server job running. Failed preparation
is not partial success: confirm complete ordered sources and exact current full
context, then explicitly prepare again. If complete material still fails, share
the preparation/request ID and safe code with support.

Readiness can expire before a source reference. `material_not_prepared` and
`prepared_material_expired` require explicit preparation once enforcement is
rolled out. Do not replay generated headers or retry generation merely because
preparation expired. The planned 30-day migration has no cutoff date in this
preview; see [current rollout status](../reference/preparation.md).
