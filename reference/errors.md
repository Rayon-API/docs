# Errors and limits

Errors use a sanitized envelope and `X-Request-ID`:

```json
{"error":{"code":"unsupported_material","message":"The supplied material could not generate the required headers.","request_id":"00000000-0000-4000-8000-000000000001","retryable":false}}
```

| HTTP | Meaning / action |
| --- | --- |
| 401 | Missing, invalid or revoked key. |
| 402 | `insufficient_credits`: check weekly allowance and wallet balance. |
| 403 | Account, policy or domain access denied. |
| 404 / 405 | Unknown route / unsupported method. |
| 408 | `input_timeout`: upload exceeded 20 seconds; no allowance consumed. |
| 413 | `input_too_large`: reduce input within [limits](./shape.md#input-limits). |
| 415 | Unsupported content type/encoding. |
| 422 | Invalid request/profile, unsupported material, expired reference or ambiguous header family. |
| 429 | Account rate or available capacity exceeded; inspect `Retry-After`. |
| 503 | Service or worker unavailable. |
| 504 | Generation timed out. |

SDKs do not retry generation POSTs. A network timeout can occur after admission and settlement; check usage/history before making another attempt. Each explicit retry is a new request.

For support, share the request ID and sanitized code. Keep scripts, cookies, keys and private application bodies out of public reports. See [troubleshooting](../guide/troubleshooting.md).

## Decide whether to retry

`error.retryable` is optional. `true` identifies a definite temporary error that may be retried after the required delay; `false` means correct the request or investigate first. An absent value is unknown. Respect `Retry-After`, add jitter and reduce concurrency. Neither SDK automatically replays generation requests. A client/network timeout or uncertain settlement response requires a history check before resubmitting; each retry is a new request.

## Check the billing outcome

In **Dashboard → Request history**, select a domain and open **Details**. The panel has a copyable request ID, recorded HTTP status (when available), timing and a safe explanation/action. **Not charged** means the canonical ledger confirms no allowance or wallet funds were consumed. **Processing billing** means the final usage record is updating and refreshes automatically. **Billing status unavailable** means no final outcome can currently be confirmed; refresh or contact support with the ID. Successful usage is identified as allowance or wallet usage. A generated header set does not prove acceptance by the target.
