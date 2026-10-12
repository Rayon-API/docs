# Errors and limits

HTTP status describes the API request. The JSON `status` describes the capture outcome. Check both.

| HTTP status | Meaning | Action |
| --- | --- | --- |
| `200` | A capture result, including possible `failed` status | Inspect `status`; acceptance is not target verification. |
| `401` | Invalid or revoked API key | Check your key securely or create a replacement in the dashboard. |
| `403` | Account or domain access denied, or policies not accepted | Check account state, domain approval, and current policies. |
| `422` | Invalid input | Correct the target URL or request/profile structure. |
| `429` | Rate, quota, or concurrency limit | Honor `Retry-After` and check dashboard limits. |
| `503` | Service unavailable | Retry later with bounded backoff. |

`Retry-After` on a `429` is expressed in seconds until another attempt may be admitted. Use bounded retries and avoid parallel retry storms. Limits depend on the account; consult the dashboard rather than hard-coding a published quota.

Quota accounting counts admitted solve attempts once, including failed attempts. Quota resets use UTC. An HTTP error does not justify assuming that every retry is free.

The response may include `X-Request-ID` for correlation with dashboard history. Keep that identifier with a redacted diagnostic record.

SDKs raise `RayonError` for request/API failures. A returned unsuccessful capture requires an explicit status check. For accepted results, `errors` may still contain earlier fallback diagnostics.
