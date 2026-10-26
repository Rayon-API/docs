# Errors and limits

Errors use a safe envelope and `X-Request-ID`:

```json
{"error":{"code":"access_denied","message":"Access to api.example.com has not been approved.","request_id":"00000000-0000-4000-8000-000000000001","retryable":false,"reason":"domain_not_approved","action":"Request access to this domain in your dashboard.","domain":"api.example.com","field":"request.url","billing_status":"not_charged"}}
```

`code`, `message` and `request_id` identify the error. Optional fields add guidance:

| Field | Meaning |
| --- | --- |
| `retryable` | Whether the error is temporary; see [retry guidance](#decide-whether-to-retry). |
| `reason` | The specific cause, without changing the error code. |
| `action` | The next step to take. |
| `domain` / `field` | The rejected hostname and request field, such as `source_url` or `request.url`. |
| `billing_status` | `not_charged`, `pending` or `unknown`; see [billing outcome](#check-the-billing-outcome). |

Messages and actions are safe explanations, never raw internal exceptions.

| HTTP | Meaning / action |
| --- | --- |
| 401 | Missing, invalid or revoked key. |
| 402 | `insufficient_credits`: top up the wallet or wait for allowance renewal. Check [usage](./usage.md). |
| 403 | Account, policy or domain access denied; inspect `reason` below. |
| 404 / 405 | Unknown route / unsupported method. |
| 408 | `input_timeout`: upload exceeded 20 seconds; no allowance consumed. |
| 413 | `input_too_large`: reduce input within [limits](./shape.md#input-limits). |
| 415 | Unsupported content type/encoding. |
| 422 | Inspect the specific code: invalid input/profile, expired reference, incomplete generation, invalid generated output or `output_too_large`. |
| 429 | `material_cache_full`: reuse existing material or wait for cache space; `rate_limited`: slow requests; `concurrency_exceeded`: reduce in-flight requests; `capacity_exceeded`: wait for service capacity. Respect `Retry-After`. |
| 503 | `credits_warming`: credits are being prepared; retry after `Retry-After: 1` (`retryable: true`). An unrecognized worker 422 is reported as 503 `generation_unavailable`; it is not classified as invalid client input. Other 503 errors mean service or worker unavailable. |
| 504 | Generation timed out. |

A 403 `access_denied` can include these reasons. Existing `policies_required` and `domain_not_approved` codes remain valid.

| Reason | Action |
| --- | --- |
| `account_disabled` | Contact support about account access. |
| `account_expired` | Check account access in the dashboard or contact support. |
| `policies_required` | Accept the required policies in the dashboard. |
| `domain_not_approved` | Request approval for the hostname in `domain`. |
| `domain_pending` | Wait for the known pending approval. |

Check both source and endpoint hosts. Approval covers a root domain and its `www` alias; other subdomains need explicit approval. `domain_pending` is returned only when a pending request is known.

Generation errors do not, by themselves, establish incorrect client input:

| Code | Next step |
| --- | --- |
| `generation_incomplete` | Include all required scripts in execution order, including any script loaded by a starter/loader. If those are complete, contact support with the request ID. |
| `generation_failed` | Check material completeness; contact support if complete inputs still fail. |
| `generation_invalid_headers` / `generation_invalid_form` | Generated output failed validation. Contact support with the request ID. |
| `output_too_large` | Generated output exceeded the response limit. Contact support with the request ID. |

SDKs use trusted local error wording; upgrade when the corresponding SDK release is available. A successful generation response does not confirm that the target accepted the result.

For support, share the request ID and safe code. Keep scripts, cookies, keys and private application bodies out of public reports. See [troubleshooting](../guide/troubleshooting.md).

## Decide whether to retry

`error.retryable` is optional. `true` identifies a temporary error; `false` means correct the request or investigate first. An absent value is unknown. Respect `Retry-After`, add jitter and reduce concurrency. SDK 1.1.4+ makes one automatic recovery attempt only after HTTP 422 `material_expired` with `billing_status: not_charged`, using original scripts still retained in that client. There are no background generation requests. Other errors, cancellation and uncertain outcomes are never automatically retried; each explicit retry is a new request.

After a client/network timeout or a response with `billing_status: pending` or `unknown`, check request history before resubmitting. Generation may already have completed. Contact support with the request ID if the outcome remains unclear.

## Check the billing outcome

`billing_status: not_charged` means no allowance or wallet funds were used. `pending` means the billing record is still updating; it does not confirm a charge. `unknown` or an absent field means billing could not be confirmed. Failed generations are not billable; usage checks are free.

In **Dashboard → Request history**, select a domain and open **Details**. The panel shows the request ID, recorded HTTP status, timing and a safe explanation/action. **Not charged** confirms no allowance or wallet funds were consumed. **Processing billing** refreshes while the final record updates. For **Billing status unavailable**, refresh or contact support with the ID. Successful usage is identified as allowance or wallet usage. A generated header set does not prove acceptance by the target.


## Preparation errors (coordinated release preview)

Preparation routes have their own lifecycle. HTTP 404 deliberately covers both
unknown and cross-key preparation IDs. Poll an existing queued/learning/validating/
publishing job rather than creating another job whenever a wait ends. Timeout or
cancellation of a client wait does not cancel the server job. A terminal failed or
expired status includes sanitized structured metadata and requires an explicit
corrected/current preparation before workload startup.

The coordinated error catalog adds `material_not_prepared`,
`prepared_material_expired`, `preparation_unavailable`, `preparation_failed`,
`preparation_expired`, `preparation_unauthorized`, `preparation_timeout`, and
`preparation_interrupted`, `material_learning`, and `idempotency_conflict`.
An idempotency conflict means a key was reused with different input; do not
change the full request when deliberately retrying one operation. Readiness enforcement remains planned until the backend
rollout and migration are announced. A `material_not_prepared` or
`prepared_material_expired` response directs callers to explicitly prepare current
full context; it does not authorize hidden learning or a generation retry.

Preparation POSTs use one stable `Idempotency-Key` per invocation. SDKs do not
retry ambiguous prepare POSTs. Bounded wait helpers retry only transient GETs
with jitter and expose a safe preparation ID for resumption. `generate` keeps
its existing billing/retry behavior; readiness metadata contains no old telemetry
to replay. See the [preparation contract](./preparation.md).
