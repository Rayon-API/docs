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
| 422 | Invalid request/profile, unsupported material, expired reference or ambiguous header family. |
| 429 | `rate_limited`: slow requests; `concurrency_exceeded`: reduce in-flight requests; `capacity_exceeded`: wait for service capacity. Respect `Retry-After`. |
| 503 | `credits_warming`: credits are being prepared; retry after `Retry-After: 1` (`retryable: true`). Other 503 errors mean service or worker unavailable. |
| 504 | Generation timed out. |

A 403 `access_denied` can include these reasons. Existing `policies_required` and `domain_not_approved` codes remain valid.

| Reason | Action |
| --- | --- |
| `account_disabled` | Contact support about account access. |
| `account_expired` | Check account access in the dashboard or contact support. |
| `policies_required` | Accept the required policies in the dashboard. |
| `domain_not_approved` | Request approval for the hostname in `domain`. |
| `domain_pending` | Wait for the known pending approval. |

Check both source and endpoint hosts. Approval covers an apex domain and its `www` alias; other subdomains need explicit approval. `domain_pending` is returned only when a pending request is known.

For support, share the request ID and safe code. Keep scripts, cookies, keys and private application bodies out of public reports. See [troubleshooting](../guide/troubleshooting.md).

## Decide whether to retry

`error.retryable` is optional. `true` identifies a temporary error; `false` means correct the request or investigate first. An absent value is unknown. Respect `Retry-After`, add jitter and reduce concurrency. Neither SDK retries generation automatically; each explicit retry is a new request.

After a client/network timeout or a response with `billing_status: pending` or `unknown`, check request history before resubmitting. Generation may already have settled. Contact support with the request ID if the outcome remains unclear.

## Check the billing outcome

`billing_status: not_charged` means rejection before admission or a confirmed release of the reserved allowance and wallet funds. `pending` means settlement is still in progress. `unknown` or an absent field does not confirm whether the request was charged.

In **Dashboard → Request history**, select a domain and open **Details**. The panel shows the request ID, recorded HTTP status, timing and a safe explanation/action. **Not charged** confirms no allowance or wallet funds were consumed. **Processing billing** refreshes while the final record updates. For **Billing status unavailable**, refresh or contact support with the ID. Successful usage is identified as allowance or wallet usage. A generated header set does not prove acceptance by the target.
