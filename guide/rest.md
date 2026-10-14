# Direct REST

## 1. Prepare the request file

Collect material using the [walkthrough](./preparation-walkthrough.md). Save the [complete request](../reference/shape.md) as UTF-8 JSON in `shape.json`.

## 2. Call RayonAPI

```sh
curl --fail-with-body --max-time 45 https://api.rayonapi.com/v1/shape \
  -H "Authorization: Bearer $RAYON_API_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @shape.json
```

Use uncompressed JSON first. Gzip requests must meet both compressed and decoded limits. Keep keys out of URLs and logs.

### Python

<<< ../examples/rest.py

### JavaScript

<<< ../examples/rest.mjs{js}

### Go

<<< ../examples/rest.go

## 3. Send the target request

[Apply the returned headers](./applying-headers.md) in the session that collected material. These examples call only RayonAPI; they do not collect scripts or send target requests.
