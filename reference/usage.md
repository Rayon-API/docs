# GET /v1/usage

Return your authenticated account's current usage, limits and UTC reset times.

```sh
curl --fail-with-body --max-time 30   https://api.rayonapi.com/v1/usage   -H "Authorization: Bearer $RAYON_API_KEY"
```

This utility does not generate headers or consume generation quota. A separate request-rate limit applies.

Admitted generation attempts count once, including failed or cancelled attempts. Invalid/unauthorized requests, expired material references and capacity/rate rejection before admission do not consume generation quota.

A client timeout does not establish whether an attempt was admitted. The returned request ID and dashboard history help investigate ambiguous outcomes.
