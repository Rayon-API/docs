# GET /v1/usage

Read your weekly allowance, USD wallet balance and current PAYG rate with the same Bearer key. Usage is free, limited separately to 60 requests per minute.

```sh
curl --fail-with-body --max-time 30 https://api.rayonapi.com/v1/usage \
  -H "Authorization: Bearer $RAYON_API_KEY"
```

## Response fields

| Field | Meaning |
| --- | --- |
| `request_id` | Correlation ID. |
| `limits.requests_per_second` | Account generation rate limit, shared across keys; trials have a 15 RPS ceiling, general accounts default to 500 RPS, and enterprise accounts default to 5,000 RPS with administrator-set overrides up to 10,000 RPS. Lower account limits and server capacity still apply. |
| `allowance.kind` | `subscription`, `owner`, `custom` or `wallet`; legacy `prepaid` may remain. |
| `allowance.weekly_limit` | Granted calls in the current period; null for wallet-only accounts. |
| `allowance.weekly_used` / `weekly_remaining` | Spent/reserved calls and available calls. |
| `allowance.weekly_resets_at` | UTC expiry/reset timestamp; null without a weekly allowance. |
| `allowance.wallet.balance_usd` | Available preloaded USD funds. |
| `allowance.wallet.balance_micro_usd` | Exact balance in millionths of one USD. |
| `allowance.payg_rate_per_1000_usd` | Current wallet price per 1,000 successful generations. |
| `allowance.complimentary_remaining` | Available unrevoked trial/bonus calls, separate from paid calls and funds. |
| `allowance.trial_ends_at` | Deprecated compatibility field; null for current complimentary credits. |
| `allowance.trial` | Trial details when applicable; `expires_at` is null for current complimentary credits. A verified paid purchase removes the trial-only RPS cap even while complimentary requests remain. |

The returned rate is your current account-wide limit across all API keys. Internal concurrency and burst admission are managed by the service; configured RPS is not reserved capacity.

Display wallet funds as authoritative. `prepaid_remaining` is a deprecated standard-rate call equivalent, not the USD balance. `legacy_prepaid_deprecated` identifies that compatibility view. Legacy `daily_used`/`monthly_used` are analytics only; no daily or monthly request cap is enforced.

## Allowance periods

| Account | Allowance behavior |
| --- | --- |
| Paid subscription | Weekly requests reset at the verified paid billing week's end without rollover. |
| Enterprise | Weekly request allocations reset without rollover. |
| Owner | 100,000 calls, reset Monday 00:00 UTC; exhaustion does not spend wallet funds. |
| Custom | Configured weekly limit, reset Monday 00:00 UTC; editing it preserves current usage. |
| Wallet only | Preloaded USD funds have no expiry or weekly cap; standard PAYG rate applies. |

An eligible paid period takes precedence over a custom allowance. Available trial/bonus calls are spent first, then weekly calls, then wallet funds. Unpaid renewals grant no calls or discount; cancellation retains paid benefits until expiry.

## Weekly plans and PAYG

| Weekly calls | Weekly USD price | Wallet USD / 1,000 calls during eligible paid period |
| --- | --- | --- |
| 12,000 | $50 | $3.50 |
| 30,000 | $100 | $2.50 |
| 100,000 | $250 | $2.00 |
| 300,000 | $500 | $1.50 |

Standard PAYG is $5 per 1,000 successful calls. Wallet funding loads USD, in $5 units; it does not buy a fixed call count. Use the returned rate after plan changes or expiry. Purchase through the [dashboard](https://dashboard.rayonapi.com); contact support for crypto payments.

One successful generation spends one complimentary or weekly call, or deducts its recorded PAYG amount from wallet funds. Failed generation releases reservations; validation and rate/capacity rejection are free. A client timeout does not prove failure—check request history before retrying.
