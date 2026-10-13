# GET /v1/usage

Read your account’s allowance, prepaid balance and weekly reset time with the same Bearer key. Generation is limited to **15 requests per second per account**, shared across API keys. No daily or monthly request cap is enforced.

```sh
curl --fail-with-body --max-time 30 https://api.rayonapi.com/v1/usage \
  -H "Authorization: Bearer $RAYON_API_KEY"
```

Usage is free and separately limited to 60 requests per minute.

```json
{
  "request_id": "00000000-0000-4000-8000-000000000001",
  "limits": {"requests_per_second": 15},
  "allowance": {
    "kind": "subscription",
    "weekly_limit": 12000,
    "weekly_used": 48,
    "weekly_remaining": 11952,
    "weekly_resets_at": "2026-10-20T12:00:00Z",
    "prepaid_remaining": 1000
  }
}
```

The example is illustrative; the response contains your actual allowance:

- **Subscription:** credits follow the verified paid billing week and expire at its end. Unused weekly credits do not roll over. Prepaid credits are used after available weekly credits.
- **Owner:** 100,000 calls per UTC week, resetting Monday at 00:00 UTC.
- **Custom:** an owner-configured weekly allowance, resetting Monday at 00:00 UTC. Editing the allowance preserves that week’s usage.
- **Prepaid:** purchased calls have no expiry or weekly cap. `weekly_limit` and `weekly_resets_at` are null.

`weekly_used` includes successful calls and currently reserved calls. Successful generation spends one call; failed generation releases its reserved credit. Validation and rate/capacity rejection are free. Owners and custom accounts use their managed weekly allowance separately from purchased credits.

Legacy `daily_used` and `monthly_used` may remain in the response as admitted-attempt analytics. They do not impose caps or measure remaining paid credits.

A client timeout does not establish whether generation succeeded. Check the returned request ID and dashboard history before retrying.
