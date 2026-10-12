# Direct REST

Send JSON to `https://api.rayonapi.com/v1/shape` with `Authorization: Bearer <key>`. The request contains your downloaded scripts, profile and exact application request.

Prepare `shape-request.json` using the [material guide](./material.md). Then:

```sh
curl --fail-with-body --max-time 30   https://api.rayonapi.com/v1/shape   -H "Authorization: Bearer $RAYON_API_KEY"   -H 'Content-Type: application/json'   --data-binary @shape-request.json
```

Do not put API keys in URLs. Use uncompressed JSON first; gzip request bodies must also meet the decoded-size limit.

## Python

<<< ../examples/rest.py

## JavaScript

<<< ../examples/rest.mjs{js}

## Go

<<< ../examples/rest.go

These examples call RayonAPI only. Your application separately downloads material and submits generated headers using its existing target session. See [applying results](./applying-headers.md).
