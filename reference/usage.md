# GET /v1/usage

Return your authenticated account's current usage, limits and UTC reset times.

```sh
curl --fail-with-body --max-time 30   https://api.rayonapi.com/v1/usage   -H "Authorization: Bearer $RAYON_API_KEY"
```

This utility does not generate headers or consume generation quota. A separate request-rate limit applies.

```json
{
  "request_id": "00000000-0000-4000-8000-000000000001",
  "daily_used": 12,
  "monthly_used": 48,
  "limits": {
    "rpm": 10,
    "burst": 10,
    "daily_quota": 1000,
    "monthly_quota": 10000,
    "concurrency": 2
  },
  "resets_at": {
    "daily": "2026-10-14T00:00:00Z",
    "monthly": "2026-11-01T00:00:00Z"
  }
}
```

These example limits are illustrative; your account's configured limits apply across its keys. Daily and monthly counters reset at the UTC timestamps returned. Usage has a separate limit of 60 requests per minute.

Admitted generation attempts count once, including failed or cancelled attempts. Invalid/unauthorized requests, expired material references and capacity/rate rejection before admission do not consume generation quota.

A client timeout does not establish whether an attempt was admitted. The returned request ID and dashboard history help investigate ambiguous outcomes.
